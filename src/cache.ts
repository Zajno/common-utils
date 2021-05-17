import { observable, makeObservable, runInAction, action } from 'mobx';
import { createLogger, ILogger } from './logger';

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

    @observable.shallow
    private readonly _itemsCache: Record<string, T> = { };

    @observable
    private readonly _itemsStatus: Record<string, boolean> = { };

    private readonly _fetchCache: Record<string, Promise<T>> = { };

    private _logger: ILogger = null;

    constructor(
        readonly fetcher: (id: K) => Promise<T>,
        readonly keyAdapter?: K extends string ? null : (k: K) => string,
        readonly keyParser?: K extends string ? null : (id: string) => K,
        readonly observeItems = false,
    ) {
        makeObservable(this);
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

    useLogger(name?: string) {
        this._logger = createLogger(`[PromiseCache:${name || '?'}]`);
        return this;
    }

    getDeferred(key: K): DeferredGetter<T> {
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

    getCurrent(id: K): T {
        const key = this._pk(id);
        const item = this._itemsCache[key];
        this.get(id);
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
        if (promise) {
            this._logger?.log(key, 'item resolved to <promise>');
            return promise;
        }

        runInAction(() => this._itemsStatus[key] = true);
        promise = this._doFetchAsync(id, key);

        runInAction(() => this._fetchCache[key] = promise);
        return promise;
    }

    private _doFetchAsync = async (id: K, key: string) => {
        try {
            const res = await this.fetcher(id);
            if (this._fetchCache[key]) {
                this._logger?.log(key, 'item\'s <promise> resolved to', res);
                const result = res
                    ? (this.observeItems ? observable.object(res) : res)
                    : null;
                runInAction(() => this._itemsCache[key] = result);
            }
            return res;
        } finally {
            runInAction(() => {
                delete this._fetchCache[key];
                this._itemsStatus[key] = false;
            });
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

    keys() {
        return Object.keys(this._itemsCache);
    }

    keysParsed() {
        if (!this.keyParser) {
            return null;
        }

        return this.keys().map(this.keyParser);
    }

    @action
    private _set(key: string, item: T, promise: Promise<T>, busy: boolean) {
        _setX(key, this._fetchCache, promise);
        _setX(key, this._itemsStatus, busy);
        _setX(key, this._itemsCache, item);
    }
}

function _setX<T>(key: string, obj: Record<string, T>, val: T) {
    if (val === undefined) {
        delete obj[key];
    } else {
        obj[key] = val;
    }
}
