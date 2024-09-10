import type { IExpireTracker } from '../structures/expire';
import type { ILazyPromise } from './types';

export class LazyPromise<T> implements ILazyPromise<T> {

    private _instance: T | undefined = undefined;
    private _busy: boolean | null = null;

    private _promise: Promise<T> | undefined;
    private _expireTracker: IExpireTracker | undefined;

    constructor(
        private readonly _factory: () => Promise<T>,
        private readonly initial: T | undefined = undefined,
    ) {
        this._instance = initial;
    }

    get busy() { return this._busy; }
    get hasValue() { return this._busy === false; }

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

    public withExpire = (tracker: IExpireTracker | undefined) => {
        this._expireTracker = tracker;
        return this;
    };

    protected ensureInstanceLoading() {
        if (this.busy === false && this._instance !== undefined && this._expireTracker?.isExpired) {
            // do not reset the instance, just make sure it will be reloaded
            this._busy = null;
        }

        if (this._busy === null) {
            this._busy = true;
            this._promise = this._factory().then(this.onResolved.bind(this));
        }
    }

    protected onResolved(res: T) {
        // case: during the promise `setInstance` was called
        if (!this._busy && this._instance !== undefined) {
            return this._instance;
        }
        this.setInstance(res);
        return res;
    }

    public setInstance = (res: T | undefined) => {
        this._busy = false;

        // refresh promise so it won't keep old callbacks
        // + make sure it's resolved with the freshest value
        // also do this before setting the instance... just in case :)
        this._promise = Promise.resolve(res!);

        this._instance = res;

        if (this._expireTracker) {
            this._expireTracker.restart();
        }

        return res;
    };

    reset = () => {
        this._busy = null;
        this._instance = this.initial;
        this._promise = undefined;
    };

    dispose = () => this.reset();
}
