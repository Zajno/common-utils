import { observable, makeObservable, action } from 'mobx';
import { PromiseCache } from '@zajno/common/structures/promiseCache';

export { DeferredGetter } from '@zajno/common/structures/promiseCache';

export class PromiseCacheObservable<T, K = string> extends PromiseCache<T, K> {

    private _observeItems = false;

    constructor(
        fetcher: (id: K) => Promise<T>,
        keyAdapter?: K extends string ? null : (k: K) => string,
        keyParser?: K extends string ? null : (id: string) => K,
        observeItems = false,
    ) {
        super(fetcher, keyAdapter, keyParser);

        makeObservable<
            PromiseCacheObservable<T, K>,
            '_itemsCache'
                | '_itemsStatus'
                | '_busyCount'
                | 'setStatus'
                | 'setPromise'
                | 'onBeforeFetch'
                | 'storeResult'
                | 'onFetchComplete'
                | '_set'
        >(this, {
            _busyCount: observable,
            _itemsCache: observable.shallow,
            _itemsStatus: observable,
            setStatus: action,
            setPromise: action,
            onBeforeFetch: action,
            storeResult: action,
            onFetchComplete: action,
            _set: action,
        });

        this._observeItems = observeItems;
    }

    useObserveItems(observeItems: boolean) {
        this._observeItems = observeItems;
        return this;
    }


    /** @override */
    protected prepareResult(res: Awaited<T>) {
        return res
            ? (this._observeItems ? observable.object(res) : res)
            : null;
    }
}
