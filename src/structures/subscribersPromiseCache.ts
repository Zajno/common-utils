import { Disposable } from '../functions/disposer';
import { PromiseCache, DeferredGetter } from './promiseCache';
import { SubscribersMap } from '../structures/subscribersMap';
import { Fields } from '../fields';
import logger from '../logger';

export type Unsub = () => void;
export type Fetcher<T> = (key: string, cb: (val: T) => Promise<void> | void) => Unsub | Promise<Unsub>;

type ObserveStrategy = boolean | 'short' | number;

export interface IObservingCache<T> {
    get(key: string): DeferredGetter<T>;
}

export class SubscribersPromiseCache<T> extends Disposable implements IObservingCache<T> {

    private readonly _cache: PromiseCache<T>;
    private readonly _observers: SubscribersMap;

    private _observeStrategy: ObserveStrategy = null;
    private readonly _observeStrategyOverrides: Record<string, ObserveStrategy> = { };

    private _updater: Fields.Updater<T> = null;

    constructor(readonly fetcher: Fetcher<T>) {
        super();

        this._cache = new PromiseCache(this._fetch);
        this._observers = new SubscribersMap(this._subscribe);

        this.disposer.add(this._observers);
    }

    public get loadingCount() { return this._cache.busyCount; }
    public get observersCount() { return this._observers.count; }

    useObservingStrategy(observe: ObserveStrategy) {
        this._observeStrategy = observe;
        if (!this._observeStrategy) {
            this._observers.clear();
        } else {
            const currentKeys = this._cache.keys();
            const timeout = getObserveTimeout(this._observeStrategy);
            currentKeys.forEach(key => this._observers.enable(key, true, timeout));
        }

        return this;
    }

    useUpdater(updater: Fields.Updater<T>) {
        this._updater = updater;
        this._cache.useObserveItems(updater != null);
        return this;
    }

    getIsCached(key: string) {
        return this._cache.hasKey(key);
    }

    getCurent(key: string) {
        return this._cache.getCurrent(key, false);
    }

    get(key: string, overrideStrategy?: ObserveStrategy, observingStartedPromise?: (p: Promise<void>) => void): DeferredGetter<T> {
        if (overrideStrategy !== undefined) {
            this._observeStrategyOverrides[key] = overrideStrategy;
        }

        const strategy = firstDefined(this._observeStrategyOverrides[key], this._observeStrategy);

        if (strategy && !this._observers.getIsObserving(key)) {
            // ensure observe
            if (this._cache.hasKey(key)) {
                // the request has been initiated already
                const timeout = getObserveTimeout(strategy);
                const promise = this._observers.enable(key, true, timeout);
                if (observingStartedPromise) {
                    observingStartedPromise(promise);
                }
                promise.catch((err: Error) => logger.error('[ObservingCache] Error on starting observe', key, strategy, err));
            }
        }

        return this._cache.getDeferred(key);
    }

    populate = (key: string, item: T) => {
        this._updateItem(key, item);
    };

    invalidate = (key: string) => {
        this._observers.enable(key, false);
        this._cache.invalidate(key);
    };

    private _fetch = async (key: string): Promise<T> => {
        let firstLoad = true;

        return new Promise<T>((resolve) => {
            Promise.resolve<Unsub>(
                this.fetcher(key, item => {
                    if (firstLoad) {
                        resolve(item);
                        firstLoad = false;
                    } else {
                        this._updateItem(key, item);
                    }
                })
            ).then(unsub => {
                const strategy = firstDefined(this._observeStrategyOverrides[key], this._observeStrategy);
                if (!strategy) {
                    // immediate unsub in case no observing strategy has been set
                    unsub();
                } else {
                    const timeout = getObserveTimeout(strategy);
                    this._observers.enable(key, true, timeout, [unsub]);
                }
            });
        });
    };

    private _subscribe = (key: string) => {
        return Promise.all([
            this.fetcher(key, item => this._updateItem(key, item)),
        ]);
    };

    private _updateItem = (key: string, item: T) => {
        if (this._updater != null && item != null) {
            const current = this._cache.getCurrent(key, false);
            if (current != null) {
                const result = this._updater(current, item);
                // re-set existing item but with updated contents
                this._cache.updateValueDirectly(key, result);
                return;
            }
        }

        this._cache.updateValueDirectly(key, item);
    };
}

function getObserveTimeout(s: ObserveStrategy) {
    if (!s) {
        return undefined;
    }

    return typeof s === 'number'
        ? s
        : (s === 'short'
            ? 5 * 60 * 1000
            : null
        );
}

function firstDefined<T>(...values: (T | undefined)[]) {
    return values.find(v => v !== undefined);
}
