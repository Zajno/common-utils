import type { ILazy, ILazyPromise } from '../lazy/types.js';
import type { IResetableModel } from '../models/types.js';
import { ExpireTracker } from './expire.js';

/**
 * Calls factory fn to fetch and store some value for a limited time.
 *
 * To factory method be called, `current` getter must be accessed.
*/
export class TempoCache<T> {

    private _current: T | undefined = undefined;

    public readonly tracker: ExpireTracker;

    constructor(readonly factory: () => T, lifetimeMs: number) {
        this.tracker = new ExpireTracker(lifetimeMs);
    }

    public get isExpired() { return this.tracker.isExpired; }

    public get current() {
        if (this.isExpired) {
            this._current = this.factory();
            this.tracker.restart();
        }
        return this._current;
    }
}

/* istanbul ignore next -- @preserve */
export namespace TempoCache {

    function createFactory<T extends IResetableModel, P extends keyof T>(source: T, key: P) {
        return () => {
            // each time factory is called means value is invalidated
            // so we need to reset the lazy
            source.reset();
            return source[key];
        };
    }

    /**
     * Creates a TempoCache instance which caches `ILazy.value` for a specified time.
     *
     * Note a limitation: calling `reset` (or changing the stored value directly in other way) on `lazy` will not affect the value cached by `TempoCache` instance.
    */
    export function createFromLazy<T>(lazy: ILazy<T> & IResetableModel, lifetimeMs: number) {
        const factory = createFactory(lazy, 'value');
        return new TempoCache(factory, lifetimeMs);
    }

    /**
     * Creates a TempoCache instance which caches `ILazyPromise.promise` for a specified time.
     *
     * Note a limitation: calling `reset` (or changing the stored value directly in other way) on `lazy` will not affect the value cached by `TempoCache` instance.
    */
    export function createFromLazyPromise<T>(lazy: ILazyPromise<T> & IResetableModel, lifetimeMs: number) {
        const factory = createFactory(lazy, 'promise');
        return new TempoCache(factory, lifetimeMs);
    }
}
