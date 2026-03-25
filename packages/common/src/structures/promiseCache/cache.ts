import { DebounceProcessor } from '../../functions/debounce.js';
import { PromiseCacheCore } from './core.js';
import type { ErrorCallback, InvalidationConfig } from './types.js';

export type { InvalidationCallback, InvalidationConfig, ErrorCallback } from './types.js';
export { DeferredGetter } from './types.js';
export { PromiseCacheCore } from './core.js';

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
        private readonly fetcher: (id: K) => Promise<T>,
        keyAdapter?: K extends string ? null : (k: K) => string,
        keyParser?: K extends string ? null : (id: string) => K,
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
     * @param keepInstance If true, the cached item will not be removed during invalidation, but the old instance is kept. Defaults to false.
    */
    useInvalidationTime(ms: number | null, keepInstance = false) {
        return this.useInvalidation(ms != null ? { expirationMs: ms, keepInstance } : null);
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
    get(id: K): Promise<T | null> {
        const { item, key, isInvalid } = this._getCurrent(id);

        // return cached item if it's not invalidated
        if (item !== undefined && !isInvalid) {
            this.logger.log(key, 'get: item resolved to', item, isInvalid ? '(invalidated)' : '');
            return Promise.resolve(item);
        }

        let promise = this._fetchCache.get(key);
        if (promise != null) {
            this.logger.log(key, 'get: item resolved to <promise>');
            return promise;
        }

        this.setStatus(key, true);

        promise = this._doFetchAsync(id, key);

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
        const keepInstance = !!this._invalidationConfig?.keepInstance;
        if (isInvalid) {
            this.logger.log(key, 'item is invalidated');
        }
        return {
            item: (isInvalid && !keepInstance) ? undefined : item,
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
    protected override storeResult(key: string, res: T | null) {
        this._enforceMaxItems(key);
        super.storeResult(key, res);
    }

    // ─── Private ─────────────────────────────────────────────────────────

    /**
     * Fetches the item asynchronously.
     * @param id The id of the item.
     * @param key The cache key.
     * @returns A promise that resolves to the fetched item.
     */
    protected _doFetchAsync = async (id: K, key: string) => {
        let isInSameVersion = true;
        try {
            this.onBeforeFetch(key);
            const v = this._version;

            let res: T | null = await this.tryFetchInBatch(id);

            if (v !== this._version) {
                isInSameVersion = false;
                // resolve with actual result but don't store it
                return res;
            }

            if (this._fetchCache.get(key) != null) {
                this.logger.log(key, 'item\'s <promise> resolved to', res);
                res = this.prepareResult(res);
                this.storeResult(key, res);
            }
            return res;
        } finally {
            if (isInSameVersion) {
                this.onFetchComplete(key);
            } else {
                this.logger.log(key, 'skipping item\'s resolve due to version change ("clear()" has been called)');
            }
        }
    };

    /** @pure Performs a fetch operation in batch mode if available, otherwise uses the regular fetch. */
    protected async tryFetchInBatch(id: K): Promise<T | null> {
        const fetchWrap = () => this.fetcher(id).catch(err => {
            this._handleError(id, err);
            return null;
        });

        if (!this._batch) {
            return fetchWrap();
        }

        const res = await this._batch.push(id)
            .catch(err => {
                this.logger.warn('batch fetch failed', id, err);
                return null;
            });
        if (!res || !res.result || res.result[res.index] === undefined) {
            // If we got to batch call, should we fallback to the direct one?
            return fetchWrap();
        }

        return res.result[res.index];
    }

    /** Handles a fetch error: stores it, logs it, and calls the onError callback. */
    private _handleError(id: K, err: unknown) {
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
