import { observable, makeObservable, action } from 'mobx';
import { PromiseCache } from '@zajno/common/structures/promiseCache';
import type { PromiseCacheFetcher, PromiseCacheKeyAdapter, PromiseCacheKeyParser } from '@zajno/common/structures/promiseCache';
import { NumberModel } from '../viewModels/NumberModel.js';
import type { IMapModel, IValueModel } from '@zajno/common/models/types.js';

export { DeferredGetter } from '@zajno/common/structures/promiseCache';
export type { InvalidationConfig, InvalidationCallback, ErrorCallback, PromiseCacheFetcher, PromiseCacheKeyAdapter, PromiseCacheKeyParser } from '@zajno/common/structures/promiseCache';

export class PromiseCacheObservable<T, K = string> extends PromiseCache<T, K> {

    private _observeItems = false;

    constructor(
        fetcher: PromiseCacheFetcher<T, K>,
        keyAdapter?: PromiseCacheKeyAdapter<K>,
        keyParser?: PromiseCacheKeyParser<K>,
        observeItems = false,
    ) {
        super(fetcher, keyAdapter, keyParser);

        makeObservable<
            PromiseCacheObservable<T, K>,
            | 'setStatus'
            | 'setPromise'
            | 'onBeforeFetch'
            | 'storeResult'
            | 'onFetchComplete'
            | '_set'
            | 'clear'
            | 'sanitize'
        >(this, {
            setStatus: action,
            setPromise: action,
            onBeforeFetch: action,
            storeResult: action,
            onFetchComplete: action,
            _set: action,
            clear: action,
            sanitize: action,
        });

        this._observeItems = observeItems;
    }

    useObserveItems(observeItems: boolean) {
        this._observeItems = observeItems;
        return this;
    }

    protected pure_createLoadingCount(): IValueModel<number> {
        return new NumberModel();
    }

    protected pure_createItemsCache(): IMapModel<string, T | undefined> {
        return observable.map<string, T | undefined>(undefined, { deep: false });
    }

    protected pure_createItemsStatus(): IMapModel<string, boolean> {
        return observable.map<string, boolean>();
    }

    protected pure_createErrorsMap(): IMapModel<string, unknown> {
        return observable.map<string, unknown>(undefined, { deep: false });
    }

    /** @override */
    protected prepareResult(res: T) {
        return this._observeItems ? observable.object(res) : res;
    }
}
