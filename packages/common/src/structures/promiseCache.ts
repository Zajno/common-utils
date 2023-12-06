import { createLogger, ILogger } from '../logger';

export type DeferredGetter<T> = {
    readonly current: T;
    readonly promise: Promise<T>;
    readonly busy: boolean;
};

export namespace DeferredGetter {
    const _resolvedPromise = Promise.resolve<undefined>(undefined);
    export const Empty = {
        get current(): undefined { return undefined; },
        get promise(): Promise<undefined> { return _resolvedPromise; },
        get busy() { return undefined; },
        isEmpty: true,
    } as DeferredGetter<null>;
}

export class PromiseCache<T, K = string> {

    protected readonly _itemsCache: Record<string, T> = { };
    protected readonly _itemsStatus: Record<string, boolean> = { };

    private readonly _fetchCache: Record<string, Promise<T>> = { };

    private _logger: ILogger = null;
    protected _busyCount = 0;

    constructor(
        readonly fetcher: (id: K) => Promise<T>,
        readonly keyAdapter?: K extends string ? null : (k: K) => string,
        readonly keyParser?: K extends string ? null : (id: string) => K
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

    useLogger(name?: string) {
        this._logger = createLogger(`[PromiseCache:${name || '?'}]`);
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

    getCurrent(id: K, initiateFetch = true): T {
        const key = this._pk(id);
        const item = this._itemsCache[key];
        if (initiateFetch) {
            this.get(id);
        }
        this._logger?.log(key, 'getCurrent returns', item);
        return item;
    }

    get(id: K): Promise<T> {
        const key = this._pk(id);
        const item = this._itemsCache[key];
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
        try {
            this.onBeforeFetch(key);
            let res = await this.fetcher(id);
            if (this._fetchCache[key] != null) {
                this._logger?.log(key, 'item\'s <promise> resolved to', res);
                res = this.prepareResult(res);
                this.storeResult(key, res);
            }
            return res;
        } finally {
            this.onFetchComplete(key);
        }
    };

    invalidate(id: K) {
        const key = this._pk(id);
        this._set(key, undefined, undefined, undefined);
    }

    updateValueDirectly(id: K, value: T) {
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

    protected _set(key: string, item: T, promise: Promise<T>, busy: boolean) {
        _setX(key, this._fetchCache, promise);
        _setX(key, this._itemsStatus, busy);
        _setX(key, this._itemsCache, item);
    }

    /** @override */
    protected setStatus(key: string, status: boolean) {
        this._itemsStatus[key] = status;
    }

    /** @override */
    protected setPromise(key: string, promise: Promise<T>) {
        this._fetchCache[key] = promise;
    }

    /** @override */
    protected onBeforeFetch(_key: string) {
        ++this._busyCount;
    }

    /** @override */
    protected prepareResult(res: Awaited<T>) {
        return res || null;
    }

    /** @override */
    protected storeResult(key: string, res: Awaited<T>) {
        this._itemsCache[key] = res;
    }

    /** @override */
    protected onFetchComplete(key: string) {
        --this._busyCount;
        delete this._fetchCache[key];
        this._itemsStatus[key] = false;
    }
}

function _setX<T>(key: string, obj: Record<string, T>, val: T) {
    if (val === undefined) {
        delete obj[key];
    } else {
        obj[key] = val;
    }
}
