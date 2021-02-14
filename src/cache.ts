import { observable, transaction } from 'mobx';
import { createLogger } from './logger';

const logger = createLogger('[PromiseCache]', true);

export type DeferredGetter<T> = {
    readonly current: T;
    readonly promise: Promise<T>;
    readonly busy: boolean;
};

export namespace DeferredGetter {
    const _resolvedPromise = Promise.resolve(null);
    export const Empty: DeferredGetter<null> = {
        get current(): null { return null; },
        get promise(): Promise<null> { return _resolvedPromise; },
        get busy() { return false; },
    };
}

export class PromiseCache<T, K = string> {

    @observable.shallow
    private readonly _itemsCache: Record<string, T> = { };

    @observable.shallow
    private readonly _itemsStatus: Record<string, boolean> = { };

    private readonly _fetchCache: Record<string, Promise<T>> = { };

    constructor(
        readonly fetcher: (id: K) => Promise<T>,
        readonly keyAdapter?: K extends string ? null : (k: K) => string,
        readonly keyParser?: K extends string ? null : (id: string) => K,
        readonly observeItems = false,
    ) {

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
        return item;
    }

    get(id: K): Promise<T> {
        const key = this._pk(id);
        const item = this._itemsCache[key];
        if (item !== undefined) {
            logger.log(key, 'item resolved to', item);
            return Promise.resolve(item);
        }

        let promise = this._fetchCache[key];
        if (promise) {
            logger.log(key, 'item resolved to <promise>');
            return promise;
        }

        this._itemsStatus[key] = true;
        promise = this._doFetchAsync(id, key);

        this._fetchCache[key] = promise;
        return promise;
    }

    private _doFetchAsync = async (id: K, key: string) => {
        try {
            const res = await this.fetcher(id);
            if (this._fetchCache[key]) {
                logger.log(key, 'item\'s <promise> resolved to', res);
                this._itemsCache[key] = res
                    ? (this.observeItems ? observable.object(res) : res)
                    : null;
            }
            return res;
        } finally {
            delete this._fetchCache[key];
            this._itemsStatus[key] = false;
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

    private _set(key: string, item: T, promise: Promise<T>, busy: boolean) {
        transaction(() => {
            _setX(key, this._fetchCache, promise);
            _setX(key, this._itemsStatus, busy);
            _setX(key, this._itemsCache, item);
        });
    }
}

function _setX<T>(key: string, obj: Record<string, T>, val: T) {
    if (val === undefined) {
        delete obj[key];
    } else {
        obj[key] = val;
    }
}
