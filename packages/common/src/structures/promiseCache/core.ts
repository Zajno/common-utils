import { Loggable } from '../../logger/loggable.js';
import { Model } from '../../models/Model.js';
import type { IMapModel, IValueModel } from '../../models/types.js';
import type { DeferredGetter } from './types.js';

/**
 * Core base class for PromiseCache. Provides basic cache operations, hooks, and `pure_create*` methods.
 *
 * This class handles:
 *  - item storage and retrieval
 *  - loading state tracking
 *  - promise caching
 *  - error storage
 *  - timestamps for cached items
 *  - direct cache manipulation (invalidate, updateValueDirectly, clear)
 *  - keys iteration
 *
 * Subclasses are expected to implement fetching logic, invalidation policies, etc.
 */
export abstract class PromiseCacheCore<T, K = string> extends Loggable {

    /** Stores resolved items in map by id. */
    protected readonly _itemsCache: IMapModel<string, T | null | undefined>;

    /** Stores items loading state (loading or not) in map by id. */
    protected readonly _itemsStatus: IMapModel<string, boolean>;

    /** Stores items loading count. */
    protected readonly _loadingCount: IValueModel<number>;

    /** Stores items Promises state (if still loading) in map by id. */
    protected readonly _fetchCache: IMapModel<string, Promise<T | null>>;

    /** Stores last errors by key. Observable-friendly via IMapModel. */
    protected readonly _errorsMap: IMapModel<string, unknown>;

    /** Stores items resolve timestamps (for expiration) in map by id. */
    protected readonly _timestamps = new Map<string, number>();

    protected _version = 0;

    constructor(
        protected readonly keyAdapter?: ((k: K) => string) | null,
        protected readonly keyParser?: ((id: string) => K) | null,
    ) {
        super();

        this._loadingCount = this.pure_createLoadingCount();
        this._itemsCache = this.pure_createItemsCache();
        this._itemsStatus = this.pure_createItemsStatus();
        this._fetchCache = this.pure_createFetchCache();
        this._errorsMap = this.pure_createErrorsMap();
    }

    // ─── Counts ──────────────────────────────────────────────────────────

    /** Returns the number of items currently being fetched. */
    public get loadingCount(): number { return this._loadingCount.value; }

    /** @deprecated Use {@link loadingCount} instead. */
    public get busyCount(): number { return this._loadingCount.value; }

    /** Returns the number of cached items (resolved values). */
    public get cachedCount(): number { return this._itemsCache.size; }

    /** Returns the number of in-flight promises (items currently being fetched). */
    public get promisesCount(): number { return this._fetchCache.size; }

    /** Returns the number of cached items that are currently invalid (expired). */
    public get invalidCount(): number {
        let count = 0;
        for (const key of this._itemsCache.keys()) {
            if (this.getIsInvalidated(key)) {
                count++;
            }
        }
        return count;
    }

    // ─── Pure factory methods (override for observability) ───────────────

    /**
     * @pure @const
     * Creates a model for tracking the loading state. Override to inject own instance, e.g. for observability.
     *
     * Warning: as name indicates, this should be "pure"/"const" function, i.e. should not reference `this`/`super`.
     */
    protected pure_createLoadingCount(): IValueModel<number> {
        return new Model(0);
    }

    /**
     * @pure @const
     * Creates a map for caching resolved items by id. Override to inject own instance, e.g. for observability.
     *
     * Warning: as name indicates, this should be "pure"/"const" function, i.e. should not reference `this`/`super`.
     */
    protected pure_createItemsCache(): IMapModel<string, T | null | undefined> {
        return new Map<string, T | null | undefined>();
    }

    /**
     * @pure @const
     * Creates a map for tracking the loading state of items by id. Override to inject own instance, e.g. for observability.
     *
     * Warning: as name indicates, this should be "pure"/"const" function, i.e. should not reference `this`/`super`.
     */
    protected pure_createItemsStatus(): IMapModel<string, boolean> {
        return new Map<string, boolean>();
    }

    /**
     * @pure @const
     * Creates a map for caching promises of items by id. Override to inject own instance, e.g. for observability.
     *
     * Warning: as name indicates, this should be "pure"/"const" function, i.e. should not reference `this`/`super`.
     */
    protected pure_createFetchCache(): IMapModel<string, Promise<T | null>> {
        return new Map<string, Promise<T | null>>();
    }

    /**
     * @pure @const
     * Creates a map for storing last errors by key. Override to inject own instance, e.g. for observability.
     *
     * Warning: as name indicates, this should be "pure"/"const" function, i.e. should not reference `this`/`super`.
     */
    protected pure_createErrorsMap(): IMapModel<string, unknown> {
        return new Map<string, unknown>();
    }

    // ─── Key handling ────────────────────────────────────────────────────

    protected _pk(k: K): string {
        if (k == null) {
            throw new Error('PromiseCache: null keys are not supported');
        }

        if (typeof k === 'string') {
            return k;
        }

        if (!this.keyAdapter) {
            throw new Error('Provide key adapter for non-string keys');
        }

        return this.keyAdapter(k);
    }

    protected getLoggerName(name: string | undefined): string {
        return `[PromiseCache:${name || '?'}]`;
    }

    // ─── Public API: reading ─────────────────────────────────────────────

    /**
     * Returns a {@link DeferredGetter} object for a specfied key.
     *
     * This can be used to access the current value, promise, loading state, and last error of the item.
     */
    getDeferred(key: K): DeferredGetter<T> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return {
            get current() { return self.getCurrent(key); },
            get promise() { return self.get(key); },
            get isLoading() { return self.getIsBusy(key); },
            get error() { return self.getLastError(key); },
        };
    }

    /**
     * Returns the loading state of an item.
     *
     * @returns true if loading, false if loading completed, undefined if loading was not started yet.
     */
    getIsBusy(id: K): boolean | undefined {
        const key = this._pk(id);
        const res = this._itemsStatus.get(key);
        if (res) {
            return res;
        }
        const isInvalid = this.getIsInvalidated(key);
        return isInvalid ? undefined : res;
    }

    /**
     * Returns whether the cached item for the specified key is valid (not expired and not invalidated by callback).
     *
     * @returns `true` if the item is cached and valid, `false` if the item is invalidated or not cached.
     */
    getIsValid(id: K): boolean {
        const key = this._pk(id);
        if (!this._itemsCache.has(key)) {
            return false;
        }
        return !this.getIsInvalidated(key);
    }

    /**
     * Returns the last error that occurred during fetching for the specified key.
     *
     * @returns The raw error, or null if no error.
     */
    getLastError(id: K): unknown {
        const key = this._pk(id);
        return this._errorsMap.get(key) ?? null;
    }

    /** Returns the current cached value, optionally triggering a fetch. */
    getCurrent(id: K, initiateFetch = true): T | null | undefined {
        const { item, key } = this._getCurrent(id);
        if (initiateFetch) {
            this.get(id);
        }
        this.logger.log(key, 'getCurrent: returns', item);
        return item;
    }

    /** Returns a promise that resolves to the cached or freshly fetched value. */
    abstract get(id: K): Promise<T | null>;

    /** Returns true if the item is cached or fetching was initiated. Does not initiate fetching. */
    hasKey(id: K) {
        const key = this._pk(id);
        return this._itemsCache.get(key) !== undefined || this._itemsStatus.get(key) !== undefined;
    }

    /** Returns an iterator over the keys of the cached items. */
    keys(iterate: true): MapIterator<string>;

    /** Returns an array of the keys of the cached items. */
    keys(): string[];

    keys(iterate: boolean = false) {
        const iterator = this._itemsCache.keys();
        return iterate
            ? iterator
            : Array.from(iterator);
    }

    /** Returns an iterator over the parsed keys of the cached items. */
    keysParsed(iterate: true): Generator<K> | null;

    /** Returns an array of the parsed keys of the cached items. */
    keysParsed(): K[] | null;

    keysParsed(iterate: boolean = false) {
        const kp = this.keyParser;
        if (!kp) {
            return null;
        }

        const keysIterator = this.keys(true);
        if (!iterate) {
            return Array.from(keysIterator, key => kp(key));
        }

        return (function* () {
            for (const key of keysIterator) {
                yield kp(key);
            }
        })();
    }

    // ─── Public API: mutation ────────────────────────────────────────────

    /** Instantly invalidates the cached item for the specified id, like it was never fetched/accessed. */
    invalidate(id: K) {
        const key = this._pk(id);
        this._set(key, undefined, undefined, undefined);
        this._errorsMap.delete(key);
        this._timestamps.delete(key);
    }

    /** Updates the cached value for the specified id directly, like it was fetched already. */
    updateValueDirectly(id: K, value: T | null) {
        const key = this._pk(id);
        this._set(key, value, undefined, undefined);
    }

    /**
     * Iterates over all cached items and removes those that are invalid (expired).
     *
     * @returns The number of items that were removed.
     */
    sanitize(): number {
        let removed = 0;
        const keysToRemove: string[] = [];

        for (const key of this._itemsCache.keys()) {
            if (this.getIsInvalidated(key)) {
                keysToRemove.push(key);
            }
        }

        for (const key of keysToRemove) {
            this._set(key, undefined, undefined, undefined);
            this._errorsMap.delete(key);
            this._timestamps.delete(key);
            removed++;
        }

        return removed;
    }

    /** Clears the cache and resets the loading state. */
    clear() {
        ++this._version;
        this._loadingCount.value = 0;

        this._itemsCache.clear();
        this._itemsStatus.clear();
        this._fetchCache.clear();
        this._errorsMap.clear();
        this._timestamps.clear();
    }

    // ─── Protected hooks ─────────────────────────────────────────────────

    /** Returns the current cached value for the specified key, without triggering a fetch. */
    protected abstract _getCurrent(id: K): { item: T | null | undefined; key: string; isInvalid: boolean };

    /**
     * Checks if the cached item for the specified key is invalidated (expired).
     * Override to implement custom invalidation logic.
     */
    protected abstract getIsInvalidated(key: string): boolean;

    /** @internal updates all caches states at once. */
    protected _set(key: string, item: T | null | undefined, promise: Promise<T> | undefined, busy: boolean | undefined) {
        PromiseCacheCore._setMapX(key, this._fetchCache, promise);
        PromiseCacheCore._setMapX(key, this._itemsStatus, busy);
        PromiseCacheCore._setMapX(key, this._itemsCache, item);
    }

    /** Updates the loading status for the specified key. Override to add a hook. */
    protected setStatus(key: string, status: boolean) {
        this.logger.log(key, 'status update:', status);
        this._itemsStatus.set(key, status);
    }

    /** Updates the promise for the specified key. Override to add a hook. */
    protected setPromise(key: string, promise: Promise<T | null>) {
        this._fetchCache.set(key, promise);
    }

    /** Stores the result for the specified key. Override to add a hook. */
    protected storeResult(key: string, res: T | null) {
        this._itemsCache.set(key, res);
        this._timestamps.set(key, Date.now());
        // Only clear error on successful (non-null) result;
        // null result may come from a caught fetch error
        if (res != null) {
            this._errorsMap.delete(key);
        }
    }

    /** Hooks into the fetch process before it starts. */
    protected onBeforeFetch(_key: string) {
        this._loadingCount.value = this._loadingCount.value + 1;
    }

    /** Hooks into the fetch process after it completes. */
    protected onFetchComplete(key: string) {
        this._loadingCount.value = this._loadingCount.value - 1;
        this._fetchCache.delete(key);
        this._itemsStatus.set(key, false);
    }

    /** Hooks into the result preparation process, before it's stored into the cache. */
    protected prepareResult(res: T | null) {
        return res || null;
    }

    /** @internal Helper to set or delete a value in a map. */
    protected static _setMapX<T>(key: string, map: IMapModel<string, T>, val: T) {
        if (val === undefined) {
            map.delete(key);
        } else {
            map.set(key, val);
        }
    }
}
