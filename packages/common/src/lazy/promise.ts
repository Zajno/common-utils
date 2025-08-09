import { tryDispose, type IDisposable } from '../functions/disposer.js';
import type { IResettableModel } from '../models/types.js';
import type { IExpireTracker } from '../structures/expire.js';
import type { ILazyPromise } from './types.js';

export class LazyPromise<T> implements ILazyPromise<T>, IDisposable, IResettableModel {

    private _instance: T | undefined = undefined;
    private _isLoading: boolean | null = null;

    private _promise: Promise<T> | undefined;
    private _expireTracker: IExpireTracker | undefined;

    constructor(
        private readonly _factory: () => Promise<T>,
        private readonly initial: T | undefined = undefined,
    ) {
        this._instance = initial;
    }

    get isLoading() { return this._isLoading; }
    get hasValue() { return this._isLoading === false; }

    get promise() {
        this.ensureInstanceLoading();
        return this._promise!;
    }

    get value() {
        this.ensureInstanceLoading();
        return this._instance!;
    }

    /** does not calls factory */
    get currentValue() {
        return this._instance;
    }

    public withExpire(tracker: IExpireTracker | undefined) {
        this._expireTracker = tracker;
        return this;
    }

    protected ensureInstanceLoading() {
        if (this.isLoading === false && this._instance !== undefined && this._expireTracker?.isExpired) {
            // do not reset the instance, just make sure it will be reloaded
            this._isLoading = null;
        }

        if (this._isLoading === null) {
            this._isLoading = true;
            this._promise = this._factory().then(this.onResolved.bind(this));
        }
    }

    protected onResolved(res: T) {
        // case: during the promise `setInstance` was called
        if (!this._isLoading && this._instance !== undefined) {
            return this._instance;
        }
        this.setInstance(res);
        return res;
    }

    public setInstance(res: T | undefined) {
        this._isLoading = false;

        // refresh promise so it won't keep old callbacks
        // + make sure it's resolved with the freshest value
        // also do this before setting the instance... just in case :)
        this._promise = Promise.resolve(res!);

        this._instance = res;

        if (this._expireTracker) {
            this._expireTracker.restart();
        }

        return res;
    }

    reset() {
        this._isLoading = null;

        const wasDisposed = tryDispose(this._instance);

        this._instance = this.initial;

        const p = this._promise;
        this._promise = undefined;

        // check if loading is still in progress
        // need to dispose abandoned value
        if (p && !wasDisposed) {
            p.then(value => {
                tryDispose(value);
            });
        }
    }

    dispose() {
        this.reset();
    }
}
