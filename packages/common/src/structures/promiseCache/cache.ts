import { DebounceProcessor } from '../../functions/debounce.js';
import { PromiseCacheCore } from './core.js';
import type { ErrorCallback, InvalidationConfig, PromiseCacheFetcher, PromiseCacheKeyAdapter, PromiseCacheKeyParser } from './types.js';

const BATCHING_DELAY = 200;

/**
 * Caches items by a key (string or another type) which are resolved by an async fetcher (`Promise`).
 *
 * Supports:
 *  - custom key adapter and parser for non-string keys.
 *  - direct manual cache manipulation.
 *  - batching of fetches.
 *  - auto-invalidation of cached items (time-based, callback-based, max items).
 *  - error tracking per key.
*/
export class PromiseCache<T, K = string> extends PromiseCacheCore<T, K> {

    private _batch: DebounceProcessor<K, T[]> | null = null;
    private _invalidationConfig: InvalidationConfig<T> | null = null;
    private _onError: ErrorCallback<K> | null = null;

    /**
     * Creates an instance of PromiseCache.
     * @param fetcher Function to fetch data by key.
     * @param keyAdapter Optional function to adapt non-string keys to strings.
     * @param keyParser Optional function to parse string keys back to their original type.
     */
    constructor(
        private readonly fetcher: PromiseCacheFetcher<T, K>,
        keyAdapter?: PromiseCacheKeyAdapter<K>,
        keyParser?: PromiseCacheKeyParser<K>,
    ) {
        super(keyAdapter, keyParser);
    }

    // ─── Configuration ───────────────────────────────────────────────────

    /**
     * Provide a fetcher function that takes multiple ids and returns multiple results at once. Will be called with a slight delay to allow multiple ids to be collected.
     *
     * Warning: resolved array should have the same order as the input array.
     *
     * When provided, effectively replaces the main fetcher; but in case of fail, fallbacks to the main fetcher.
    */
    useBatching(fetcher: (ids: K[]) => Promise<T[]>, delay = BATCHING_DELAY) {
        this._batch = fetcher ? new DebounceProcessor(fetcher, delay) : null;
        return this;
    }

    /**
     * Enables auto-invalidation of cached items by time.
     *
     * This is a convenience wrapper around {@link useInvalidation}.
     *
     * @param ms Time in milliseconds after which the item will be considered invalid. If null, auto-invalidation is disabled.
     *
     * @deprecated The `keepInstance` parameter is deprecated and ignored — stale values are now always kept during invalidation.
     * Use `invalidate()` followed by `get()` if you need to clear the stale value before re-fetching.
    */
    useInvalidationTime(ms: number | null, _keepInstance?: boolean) {
        return this.useInvalidation(ms != null ? { expirationMs: ms } : null);
    }

    /**
     * Configures advanced invalidation policy.
     *
     * The config object is stored as-is (not destructured), so getter-based fields will be re-evaluated on each access.
     * This allows consumers to provide dynamic invalidation policies.
     *
     * @param config The invalidation configuration. See {@link InvalidationConfig} for details.
     */
    useInvalidation(config: InvalidationConfig<T> | null) {
        this._invalidationConfig = config;
        return this;
    }

    /**
     * Sets an error callback that is called when a fetcher fails.
     *
     * @param callback The callback to call on error. Receives the original key and the raw error.
     */
    useOnError(callback: ErrorCallback<K> | null) {
        this._onError = callback;
        return this;
    }

    // ─── Core implementation ─────────────────────────────────────────────

    /**
     * Returns a promise that resolves to the cached value of the item if loaded already, otherwise starts fetching and the promise will be resolved to the final value.
     *
     * Consequent calls will return the same promise until it resolves.
     *
     * @param id The id of the item.
     * @returns A promise that resolves to the result, whether it's cached or freshly fetched.
     */
    get(id: K): Promise<T | undefined> {
        const { item, key, isInvalid } = this._getCurrent(id);

        // return cached item if it's not invalidated
        if (item !== undefined && !isInvalid) {
            this.logger.log(key, 'get: item resolved to', item, isInvalid ? '(invalidated)' : '');
            return Promise.resolve(item);
        }

        // Join an existing in-flight fetch/refresh if one exists
        let promise = this._fetchCache.get(key);
        if (promise != null) {
            this.logger.log(key, 'get: item resolved to <promise>');
            return promise;
        }

        this.setStatus(key, true);

        promise = this._doFetchAsync(id, key, false);

        this.setPromise(key, promise);

        return promise;
    }

    /**
     * Re-fetches the value for the specified key while keeping the stale cached value available.
     *
     * Does not change the loading status — consumers reading `getCurrent()` / `getLazy().value`
     * continue to see the stale value as if nothing happened.
     *
     * Implements "latest wins" concurrency: if multiple refreshes are called concurrently,
     * all promises resolve to the value from the latest refresh.
     *
     * On error, the stale value is preserved and the error is stored.
     *
     * @param id The key of the item to refresh.
     * @returns A promise resolving to the refreshed value, or the stale value on error.
     */
    refresh(id: K): Promise<T | undefined> {
        const key = this._pk(id);

        const promise = this._doFetchAsync(id, key, true);

        this.setPromise(key, promise);

        return promise;
    }

    /** Clears the cache and resets the loading state. */
    override clear() {
        this._batch?.clear();
        super.clear();
    }

    // ─── Protected overrides ─────────────────────────────────────────────

    protected _getCurrent(id: K) {
        const key = this._pk(id);
        const isInvalid = this.getIsInvalidated(key);
        // make sure current item is hooked here from the cache (required by observers)
        const item = this._itemsCache.get(key);
        if (isInvalid) {
            this.logger.log(key, 'item is invalidated');
        }
        return {
            // Always keep the stale value visible — stale-while-revalidate by default.
            // Use `invalidate()` + `get()` to clear the stale value before re-fetching.
            item,
            key,
            isInvalid,
        };
    }

    protected getIsInvalidated(key: string) {
        const config = this._invalidationConfig;
        if (!config) {
            return false;
        }

        const ts = this._timestamps.get(key);

        // Check time-based expiration
        const expirationMs = config.expirationMs;
        if (expirationMs != null && expirationMs > 0 && ts != null) {
            if (Date.now() - ts > expirationMs) {
                return true;
            }
        }

        // Check callback-based invalidation
        if (config.invalidationCheck) {
            const value = this._itemsCache.get(key);
            if (value !== undefined && config.invalidationCheck(key, value, ts ?? 0)) {
                return true;
            }
        }

        return false;
    }

    /** @override Stores the result for the specified key, enforcing max items. */
    protected override storeResult(key: string, res: T) {
        this._enforceMaxItems(key);
        super.storeResult(key, res);
    }

    // ─── Private ─────────────────────────────────────────────────────────

    /**
     * Unified fetch method with "latest wins" semantics.
     *
     * - Tracks the active factory promise per key via `_activeFetchPromises`.
     * - If superseded by a newer fetch, delegates to the newer promise.
     * - On error, preserves the stale cached value.
     *
     * @param id The original key.
     * @param key The string cache key.
     * @returns A promise resolving to the fetched/refreshed value, or the stale value on error.
     */
    protected async _doFetchAsync(id: K, key: string, refreshing: boolean): Promise<T | undefined> {
        let isInSameVersion = true;
        let isLatest = false;
        try {
            this.onBeforeFetch(key);
            const v = this._version;

            // Create the factory promise and mark it as the active one for this key (latest wins)
            const factoryPromise: Promise<T | undefined> = this.tryFetchInBatch(id, refreshing)
                .then(r => r as T | undefined);
            this._activeFetchPromises.set(key, factoryPromise);

            let res: T | undefined;
            let fetchFailed = false;
            try {
                res = await factoryPromise;
            } catch (err) {
                this._handleError(id, err);
                fetchFailed = true;
                res = undefined;
            }

            if (v !== this._version) {
                isInSameVersion = false;
                this._activeFetchPromises.delete(key);
                // resolve with actual result but don't store it
                return res;
            }

            // Check if this is still the active (latest) fetch for this key
            isLatest = this._activeFetchPromises.get(key) === factoryPromise;

            if (!isLatest) {
                // Superseded by a newer refresh/fetch — delegate to the latest active promise.
                // This ensures anyone awaiting this old promise gets the fresh value,
                // mirroring LazyPromise's "latest wins" behavior.
                const newerPromise = this._activeFetchPromises.get(key);
                if (newerPromise) {
                    // Catch errors from the newer promise — if it fails, fall back to stale value.
                    // Without this, the raw factory promise error would surface as an unhandled rejection.
                    return newerPromise.catch(() => this._itemsCache.get(key));
                }
                // Fallback: return current cached value
                return this._itemsCache.get(key);
            }

            // We are the latest — clean up tracking
            this._activeFetchPromises.delete(key);

            if (!fetchFailed && res !== undefined) {
                this.logger.log(key, 'item\'s <promise> resolved to', res);
                res = this.prepareResult(res);
                this.storeResult(key, res);
            } else if (fetchFailed) {
                // Keep stale value — return whatever is in cache
                return this._itemsCache.get(key);
            }

            return res;
        } finally {
            if (!isInSameVersion) {
                this.logger.log(key, 'skipping item\'s resolve due to version change ("clear()" has been called)');
            } else if (isLatest) {
                // Only the latest fetch should clean up the fetch state.
                // Superseded fetches delegate to the latest and should not
                // prematurely clear the fetch cache or loading status.
                this.onFetchComplete(key);
            } else {
                // Superseded fetch — only decrement loading count, don't touch fetch cache/status
                this._loadingCount.value = this._loadingCount.value - 1;
            }
        }
    }

    /** Performs a fetch operation in batch mode if available, otherwise uses the regular fetch. Throws on error. */
    protected async tryFetchInBatch(id: K, refreshing?: boolean): Promise<T> {
        if (!this._batch) {
            return this.fetcher(id, refreshing);
        }

        const res = await this._batch.push(id)
            .catch(err => {
                this.logger.warn('batch fetch failed', id, err);
                return null;
            });
        if (!res || !res.result || res.result[res.index] === undefined) {
            // batch call failed or returned no result — fallback to the direct fetcher
            return this.fetcher(id, refreshing);
        }

        return res.result[res.index];
    }

    /** Handles a fetch error: stores it, logs it, and calls the onError callback. */
    protected _handleError(id: K, err: unknown) {
        const key = this._pk(id);
        this._errorsMap.set(key, err);
        this.logger.warn('fetcher failed', id, err);

        if (this._onError) {
            try {
                this._onError(id, err);
            } catch {
                // ignore errors in the callback
            }
        }
    }

    /**
     * Enforces the max items limit by removing items to make room.
     * Strategy: first removes invalid items, then oldest valid items.
     * Items currently being fetched (in-flight) are not evicted.
     *
     * @param incomingKey The key of the item about to be stored (excluded from eviction).
     */
    private _enforceMaxItems(incomingKey: string) {
        const maxItems = this._invalidationConfig?.maxItems;
        if (maxItems == null || maxItems <= 0) {
            return;
        }

        // If we're under the limit, nothing to do
        if (this._itemsCache.size < maxItems) {
            return;
        }

        // Phase 1: Remove invalid items first (they're garbage anyway)
        const invalidKeys: string[] = [];
        for (const key of this._itemsCache.keys()) {
            if (key === incomingKey) continue;
            if (this.getIsInvalidated(key)) {
                invalidKeys.push(key);
            }
        }

        for (const key of invalidKeys) {
            this._set(key, undefined, undefined, undefined);
            this._errorsMap.delete(key);
            this._timestamps.delete(key);

            if (this._itemsCache.size < maxItems) {
                return;
            }
        }

        // Phase 2: Remove oldest valid items (skip in-flight items)
        while (this._itemsCache.size >= maxItems) {
            let oldestKey: string | null = null;
            let oldestTs = Infinity;

            for (const [key, ts] of this._timestamps.entries()) {
                // Don't evict the incoming key or items currently being fetched
                if (key === incomingKey) continue;
                if (this._fetchCache.has(key)) continue;

                if (ts < oldestTs) {
                    oldestTs = ts;
                    oldestKey = key;
                }
            }

            if (oldestKey != null) {
                this._set(oldestKey, undefined, undefined, undefined);
                this._timestamps.delete(oldestKey);
                this._errorsMap.delete(oldestKey);
            } else {
                // No evictable items found (all are in-flight or incoming)
                break;
            }
        }
    }
}
