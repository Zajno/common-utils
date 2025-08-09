import { ThrottleProcessor } from '../functions/throttle.js';
import { Loggable } from '../logger/loggable.js';
import { Model } from '../models/Model.js';
import type { IMapModel, IValueModel } from '../models/types.js';

/** Represents a state of a cached item. Holds a references to an actual state. */
export type DeferredGetter<T> = {
    /** Get current resolved value, if any, or initiates fetching. */
    readonly current: T | null | undefined;

    /** Returns a promise that resolves to the current or fetching value. */
    readonly promise: Promise<T | null>;

    /** Returns true if the item is currently being fetched. Returns undefined if fetching has not started yet. */
    readonly isLoading: boolean | undefined;
};

export namespace DeferredGetter {
    const _resolvedPromise = Promise.resolve<null>(null);

    /** Empty resolved value. */
    export const Empty = {
        get current(): null { return null; },
        get promise(): Promise<null> { return _resolvedPromise; },
        get isLoading() { return false; },
    } satisfies DeferredGetter<null>;
}

const BATCHING_DELAY = 200;

/**
 * Caches items by a key (string or another type) which are resolved by an async fetcher (`Promise`).
 *
 * Supports:
 *  - custom key adapter and parser for non-string keys.
 *  - direct manual cache manipulation.
 *  - batching of fetches.
 *  - auto-invalidation of cached items.
*/
export class PromiseCache<T, K = string> extends Loggable {

    /** Stores resolved items in map by id. */
    protected readonly _itemsCache: IMapModel<string, T | null | undefined>;

    /** Stores items loading state (loading or not) in map by id. */
    protected readonly _itemsStatus: IMapModel<string, boolean>;

    /** Stores items loading count. */
    protected readonly _loadingCount: IValueModel<number>;

    /** Stores items Promises state (if still loading) in map by id. */
    private readonly _fetchCache: IMapModel<string, Promise<T | null>>;

    /** Stores items resolve timestamps (for expiration) in map by id. */
    private readonly _timestamps = new Map<string, number>();

    private _batch: ThrottleProcessor<K, T[]> | null = null;
    private _invalidationTimeMs: number | null = null;
    private _keepInstanceDuringInvalidation = false;

    private _version = 0;

    /**
     * Creates an instance of PromiseCache.
     * @param fetcher Function to fetch data by key.
     * @param keyAdapter Optional function to adapt non-string keys to strings.
     * @param keyParser Optional function to parse string keys back to their original type.
     */
    constructor(
        private readonly fetcher: (id: K) => Promise<T>,
        private readonly keyAdapter?: K extends string ? null : (k: K) => string,
        private readonly keyParser?: K extends string ? null : (id: string) => K,
    ) {
        super();

        this._loadingCount = this.pure_createBusyCount();
        this._itemsCache = this.pure_createItemsCache();
        this._itemsStatus = this.pure_createItemsStatus();
        this._fetchCache = this.pure_createFetchCache();
    }

    public get busyCount(): number { return this._loadingCount.value; }

    /**
     * @pure @const
     * Creates a model for tracking the loading state. Override to inject own instance, e.g. for observability.
     *
     * Warning: as name indicates, this should be "pure"/"const" function, i.e. should not reference `this`/`super`.
     *
     * @returns A value model for the loading count.
     */
    protected pure_createBusyCount(): IValueModel<number> {
        return new Model(0);
    }

    /**
     * @pure @const
     * Creates a map for caching resolved items by id. Override to inject own instance, e.g. for observability.
     *
     * Warning: as name indicates, this should be "pure"/"const" function, i.e. should not reference `this`/`super`.
     *
     * @returns A map model for the items cache.
     */
    protected pure_createItemsCache(): IMapModel<string, T | null | undefined> {
        return new Map<string, T | null | undefined>();
    }

    /**
     * @pure @const
     * Creates a map for tracking the loading state of items by id. Override to inject own instance, e.g. for observability.
     *
     * Warning: as name indicates, this should be "pure"/"const" function, i.e. should not reference `this`/`super`.
     *
     * @returns A map model for the items loading state.
     */
    protected pure_createItemsStatus(): IMapModel<string, boolean> {
        return new Map<string, boolean>();
    }

    /**
     * @pure @const
     * Creates a map for caching promises of items by id. Override to inject own instance, e.g. for observability.
     *
     * Warning: as name indicates, this should be "pure"/"const" function, i.e. should not reference `this`/`super`.
     *
     * @returns A map model for the items promises cache.
     */
    protected pure_createFetchCache(): IMapModel<string, Promise<T | null>> {
        return new Map<string, Promise<T | null>>();
    }

    private _pk(k: K): string {
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

    /**
     * Creates a logger name for this instance.
     * @param name The name of the cache instance.
     * @returns The logger name.
     */
    protected getLoggerName(name: string | undefined): string {
        return `[PromiseCache:${name || '?'}]`;
    }

    /**
     * Provide a fetcher function that takes multiple ids and returns multiple results at once. Will be called with a slight delay to allow multiple ids to be collected.
     *
     * Warning: resolved array should have the same order as the input array.
     *
     * When provided, effectively replaces the main fetcher; but in case of fail, fallbacks to the main fetcher.
    */
    useBatching(fetcher: (ids: K[]) => Promise<T[]>, delay = BATCHING_DELAY) {
        this._batch = fetcher ? new ThrottleProcessor(fetcher, delay) : null;
        return this;
    }

    /**
     * Enables auto-invalidation of cached items.
     *
     * @param ms Time in milliseconds after which the item will be considered invalid. If null, auto-invalidation is disabled.
     * @param keepInstance If true, the cached item will not be removed during invalidation, but will be set to `undefined` instead. Defaults to false.
    */
    useInvalidationTime(ms: number | null, keepInstance = false) {
        this._invalidationTimeMs = ms;
        this._keepInstanceDuringInvalidation = keepInstance;
        return this;
    }

    /**
     * Returns a {@link DeferredGetter} object for a specfied key.
     *
     * This can be used to access the current value, promise, and loading state of the item.
     *
     * @param key The key of the item.
     */
    getDeferred(key: K): DeferredGetter<T> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return {
            get current() { return self.getCurrent(key); },
            get promise() { return self.get(key); },
            get isLoading() { return self.getIsBusy(key); },
        };
    }

    /**
     * Returns the loading state of an item.
     *
     * @param id The id of the item.
     * @returns The loading state of the item: true if loading, false if loading completed, undefined if loading was not started yet for the specified key.
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
     * Returns the current cached value for the specified key, without triggering a fetch.
     * @param id The id of the item.
     * @returns The current cached value of the item.
     */
    protected _getCurrent(id: K) {
        const key = this._pk(id);
        const isInvalid = this.getIsInvalidated(key);
        // make sure current item is hooked here from the cache (required by observers)
        const item = this._itemsCache.get(key);
        if (isInvalid) {
            this.logger.log(key, 'item is invalidated');
        }
        return {
            item: (isInvalid && !this._keepInstanceDuringInvalidation) ? undefined : item,
            key,
            isInvalid,
        };
    }

    /**
     * Returns the current cached value for the specified key, optionally triggering a fetch.
     * @param id The id of the item.
     * @param initiateFetch If true, will initiate a fetch if the item is not cached.
     * @returns The current cached value of the item.
     */
    getCurrent(id: K, initiateFetch = true): T | null | undefined {
        const { item, key } = this._getCurrent(id);
        if (initiateFetch) {
            // spin fetch
            this.get(id);
        }
        this.logger.log(key, 'getCurrent: returns', item);
        return item;
    }

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

    /**
     * Instantly invalidates the cached item for the specified id, like it was never fetched/accessed.
     * @param id The id of the item.
     */
    invalidate(id: K) {
        const key = this._pk(id);
        this._set(key, undefined, undefined, undefined);
    }

    /**
     * Updates the cached value for the specified id directly, like it was fetched already. Overrides existing value, if any.
     * @param id The id of the item.
     * @param value The new value to cache.
     */
    updateValueDirectly(id: K, value: T | null) {
        const key = this._pk(id);
        this._set(key, value, undefined, undefined);
    }

    /** Returns true if the item is cached or fetching was initiated. Does not initiates fetching. */
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

    /** Clears the cache and resets the loading state. */
    clear() {
        ++this._version;
        this._loadingCount.value = 0;
        this._batch?.clear();

        this._itemsCache.clear();
        this._itemsStatus.clear();
        this._fetchCache.clear();
    }

    /** @internal updates all caches states at once. */
    protected _set(key: string, item: T | null | undefined, promise: Promise<T> | undefined, busy: boolean | undefined) {
        _setX(key, this._fetchCache, promise);
        _setX(key, this._itemsStatus, busy);
        _setX(key, this._itemsCache, item);
    }

    /**
     * Checks if the cached item for the specified key is invalidated (expired).
     * @param key The cache key.
     * @returns True if the item is invalidated, false otherwise.
     */
    protected getIsInvalidated(key: string) {
        if (!this._invalidationTimeMs) {
            return false;
        }

        const ts = this._timestamps.get(key);
        return ts != null && Date.now() - ts > this._invalidationTimeMs;
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

    /** @pure Performs a fetch operation in batch mode if available, otherwise uses the regular fetch. */
    protected async tryFetchInBatch(id: K): Promise<T | null> {
        const fetchWrap = () => this.fetcher(id).catch(err => {
            this.logger.warn('fetcher failed', id, err);
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
}

function _setX<T>(key: string, map: IMapModel<string, T>, val: T) {
    if (val === undefined) {
        map.delete(key);
    } else {
        map.set(key, val);
    }
}
