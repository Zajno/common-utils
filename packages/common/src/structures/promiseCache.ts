import { ThrottleProcessor } from '../functions/throttle';
import { createLogger, ILogger } from '../logger';

export type DeferredGetter<T> = {
    readonly current: T | null | undefined;
    readonly promise: Promise<T | null>;
    readonly busy: boolean;
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
export class PromiseCache<T, K = string> {

    protected _itemsCache: Record<string, T | null | undefined> = {};
    protected _itemsStatus: Record<string, boolean> = {};

    private _fetchCache: Record<string, Promise<T | null>> = {};
    private _timestamps = new Map<string, number>();

    private _batch: ThrottleProcessor<K, T[]> | null = null;
    private _invalidationTimeMs: number | null = null;

    private _logger: ILogger | null = null;
    private _version = 0;
    protected _busyCount = 0;

    constructor(
        private readonly fetcher: (id: K) => Promise<T>,
        private readonly keyAdapter?: K extends string ? null : (k: K) => string,
        private readonly keyParser?: K extends string ? null : (id: string) => K
    ) {
        //
    }

    public get busyCount() { return this._busyCount; }

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

    useLogger(nameOrLogger?: string | ILogger | undefined) {
        if (nameOrLogger != null && typeof nameOrLogger !== 'string') {
            this._logger = nameOrLogger;
        } else {
            this._logger = createLogger(`[PromiseCache:${nameOrLogger || '?'}]`);
        }
        return this;
    }

    /**
     * Provide a fetcher function that takes multiple ids and returns multiple results at once. Will be called with a slight delay to allow multiple ids to be collected.
     *
     * Warning: resolved array should have the same order as the input array.
     *
     * When provided, effectively replaces the main fetcher; but in case of fail, fallbacks to the main fetcher.
    */
    useBatching(fetcher: (ids: K[]) => Promise<T[]>) {
        this._batch = fetcher ? new ThrottleProcessor(fetcher, BATCHING_DELAY) : null;
        return this;
    }

    /**
     * Enables auto-invalidation of cached items.
     *
     * @param ms Time in milliseconds after which the item will be considered invalid. If null, auto-invalidation is disabled.
    */
    useInvalidationTime(ms: number | null) {
        this._invalidationTimeMs = ms;
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

    getIsBusy(id: K): boolean {
        const key = this._pk(id);
        return this._itemsStatus[key];
    }

    getCurrent(id: K, initiateFetch = true): T | null | undefined {
        const key = this._pk(id);
        const isInvalid = this.getIsInvalidated(key);
        const item = isInvalid ? undefined : this._itemsCache[key];
        if (initiateFetch) {
            this.get(id);
        }
        this._logger?.log(key, 'getCurrent returns', item);
        return item;
    }

    get(id: K): Promise<T | null> {
        const key = this._pk(id);
        const isInvalid = this.getIsInvalidated(key);
        const item = isInvalid ? undefined : this._itemsCache[key];
        if (item !== undefined) {
            this._logger?.log(key, 'item resolved to', item);
            return Promise.resolve(item);
        }

        let promise = this._fetchCache[key];
        if (promise != null) {
            this._logger?.log(key, 'item resolved to <promise>');
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

            if (this._fetchCache[key] != null) {
                this._logger?.log(key, 'item\'s <promise> resolved to', res);
                res = this.prepareResult(res);
                this.storeResult(key, res);
            }
            return res;
        } finally {
            if (isInSameVersion) {
                this.onFetchComplete(key);
            } else {
                this._logger?.log(key, 'skipping item\'s resolve due to version change ("clear()" has been called)');
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
        return this._itemsCache[key] !== undefined || this._itemsStatus[key] !== undefined;
    }

    keys() {
        return Object.keys(this._itemsCache);
    }

    keysParsed() {
        if (!this.keyParser) {
            return null;
        }

        return this.keys().map(this.keyParser);
    }

    clear() {
        ++this._version;
        this._busyCount = 0;
        this._batch?.clear();

        this._itemsCache = {};
        this._itemsStatus = {};
        this._fetchCache = {};
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
        this._itemsStatus[key] = status;
    }

    /** @override */
    protected setPromise(key: string, promise: Promise<T | null>) {
        this._fetchCache[key] = promise;
    }

    /** @override */
    protected storeResult(key: string, res: T | null) {
        this._itemsCache[key] = res;
        this._timestamps.set(key, Date.now());
    }

    /** @override */
    protected onBeforeFetch(_key: string) {
        ++this._busyCount;
    }

    /** @override */
    protected prepareResult(res: T | null) {
        return res || null;
    }

    /** @override */
    protected onFetchComplete(key: string) {
        --this._busyCount;
        delete this._fetchCache[key];
        this._itemsStatus[key] = false;
    }

    /** @pure */
    protected async tryFetchInBatch(id: K): Promise<T | null> {
        const fetchWrap = () => this.fetcher(id).catch(err => {
            this._logger?.warn('fetcher failed', id, err);
            return null;
        });

        if (!this._batch) {
            return fetchWrap();
        }

        const res = await this._batch.push(id)
            .catch(err => {
                this._logger?.warn('batch fetch failed', id, err);
                return null;
            });
        if (!res || !res.result || res.result[res.index] === undefined) {
            // If we got to batch call, should we fallback to the direct one?
            return fetchWrap();
        }

        return res.result[res.index];
    }
}

function _setX<T>(key: string, obj: Record<string, T>, val: T) {
    if (val === undefined) {
        delete obj[key];
    } else {
        obj[key] = val;
    }
}
