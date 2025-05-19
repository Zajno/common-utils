import { ThrottleProcessor } from '../functions/throttle.js';
import { Loggable } from '../logger/loggable.js';
import { Model } from '../models/Model.js';
import type { IMapModel, IValueModel } from '../models/types.js';

export type DeferredGetter<T> = {
    readonly current: T | null | undefined;
    readonly promise: Promise<T | null>;
    readonly busy: boolean | undefined;
};

export namespace DeferredGetter {
    const _resolvedPromise = Promise.resolve<null>(null);

    export const Empty = {
        get current(): null { return null; },
        get promise(): Promise<null> { return _resolvedPromise; },
        get busy() { return false; },
    } satisfies DeferredGetter<null>;
}

const BATCHING_DELAY = 200;

/** Caches items by key which are resolve by a promise.
 *
 * Supports:
 *  - custom key adapter and parser for non-string keys.
 *  - batching of fetches.
 *  - auto-invalidation of cached items.
*/
export class PromiseCache<T, K = string> extends Loggable {

    protected readonly _itemsCache: IMapModel<string, T | null | undefined>;
    protected readonly _itemsStatus: IMapModel<string, boolean>;
    protected readonly _busyCount: IValueModel<number>;

    private readonly _fetchCache: IMapModel<string, Promise<T | null>>;
    private readonly _timestamps = new Map<string, number>();

    private _batch: ThrottleProcessor<K, T[]> | null = null;
    private _invalidationTimeMs: number | null = null;
    private _keepInstanceDuringInvalidation = false;

    private _version = 0;

    constructor(
        private readonly fetcher: (id: K) => Promise<T>,
        private readonly keyAdapter?: K extends string ? null : (k: K) => string,
        private readonly keyParser?: K extends string ? null : (id: string) => K,
    ) {
        super();

        this._busyCount = this.pure_createBusyCount();
        this._itemsCache = this.pure_createItemsCache();
        this._itemsStatus = this.pure_createItemsStatus();
        this._fetchCache = this.pure_createFetchCache();
    }

    public get busyCount(): number { return this._busyCount.value; }

    protected pure_createBusyCount(): IValueModel<number> {
        return new Model(0);
    }

    protected pure_createItemsCache(): IMapModel<string, T | null | undefined> {
        return new Map<string, T | null | undefined>();
    }

    protected pure_createItemsStatus(): IMapModel<string, boolean> {
        return new Map<string, boolean>();
    }

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
    */
    useInvalidationTime(ms: number | null, keepInstance = false) {
        this._invalidationTimeMs = ms;
        this._keepInstanceDuringInvalidation = keepInstance;
        return this;
    }

    getDeferred(key: K): DeferredGetter<T> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return {
            get current() { return self.getCurrent(key); },
            get promise() { return self.get(key); },
            get busy() { return self.getIsBusy(key); },
        };
    }

    getIsBusy(id: K): boolean | undefined {
        const key = this._pk(id);
        const res = this._itemsStatus.get(key);
        if (res) {
            return res;
        }
        const isInvalid = this.getIsInvalidated(key);
        return isInvalid ? undefined : res;
    }

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

    getCurrent(id: K, initiateFetch = true): T | null | undefined {
        const { item, key } = this._getCurrent(id);
        if (initiateFetch) {
            // spin fetch
            this.get(id);
        }
        this.logger.log(key, 'getCurrent: returns', item);
        return item;
    }

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

    invalidate(id: K) {
        const key = this._pk(id);
        this._set(key, undefined, undefined, undefined);
    }

    updateValueDirectly(id: K, value: T | null) {
        const key = this._pk(id);
        this._set(key, value, undefined, undefined);
    }

    hasKey(id: K) {
        const key = this._pk(id);
        return this._itemsCache.get(key) !== undefined || this._itemsStatus.get(key) !== undefined;
    }

    keys(iterate: true): MapIterator<string>;
    keys(): string[];

    keys(iterate: boolean = false) {
        const iterator = this._itemsCache.keys();
        return iterate
            ? iterator
            : Array.from(iterator);
    }

    keysParsed(iterate: true): Generator<K> | null;
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

    clear() {
        ++this._version;
        this._busyCount.value = 0;
        this._batch?.clear();

        this._itemsCache.clear();
        this._itemsStatus.clear();
        this._fetchCache.clear();
    }

    protected _set(key: string, item: T | null | undefined, promise: Promise<T> | undefined, busy: boolean | undefined) {
        _setX(key, this._fetchCache, promise);
        _setX(key, this._itemsStatus, busy);
        _setX(key, this._itemsCache, item);
    }

    protected getIsInvalidated(key: string) {
        if (!this._invalidationTimeMs) {
            return false;
        }

        const ts = this._timestamps.get(key);
        return ts != null && Date.now() - ts > this._invalidationTimeMs;
    }

    /** @override */
    protected setStatus(key: string, status: boolean) {
        this.logger.log(key, 'status update:', status);
        this._itemsStatus.set(key, status);
    }

    /** @override */
    protected setPromise(key: string, promise: Promise<T | null>) {
        this._fetchCache.set(key, promise);
    }

    /** @override */
    protected storeResult(key: string, res: T | null) {
        this._itemsCache.set(key, res);
        this._timestamps.set(key, Date.now());
    }

    /** @override */
    protected onBeforeFetch(_key: string) {
        this._busyCount.value = this._busyCount.value + 1;
    }

    /** @override */
    protected prepareResult(res: T | null) {
        return res || null;
    }

    /** @override */
    protected onFetchComplete(key: string) {
        this._busyCount.value = this._busyCount.value - 1;
        this._fetchCache.delete(key);
        this._itemsStatus.set(key, false);
    }

    /** @pure */
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
