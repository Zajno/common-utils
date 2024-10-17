import type { IExpireTracker } from '../structures/expire.js';
import type { ILazy } from './types.js';

export class Lazy<T> implements ILazy<T> {

    protected _instance: T | undefined = undefined;
    private _expireTracker: IExpireTracker | undefined;
    private _disposer?: (prev: T) => void;

    constructor(protected readonly _factory: (() => T)) { }

    get hasValue() { return this._instance !== undefined; }

    get value() {
        this.ensureInstance();
        return this._instance!;
    }

    get currentValue() {
        return this._instance;
    }

    /** Override me: additional way to make sure instance is valid */
    protected get isValid() {
        if (!this.hasValue) {
            return false;
        }

        if (this._expireTracker) {
            if (this._expireTracker.isExpired) {
                this.reset();
                return false;
            }
        }

        return true;
    }

    public withDisposer = (disposer: (prev: T) => void) => {
        this._disposer = disposer;
        return this;
    };

    public withExpire = (tracker: IExpireTracker | undefined) => {
        this._expireTracker = tracker;
        return this;
    };

    private ensureInstance() {
        if (this.isValid) {
            return;
        }

        // additional reset to make sure previous instance has been disposed
        this.reset();
        const res = this._factory();
        this.setInstance(res);
    }

    prewarm() {
        this.ensureInstance();
        return this;
    }

    setInstance(instance: T | undefined) {
        this._instance = instance;

        if (this._instance !== undefined && this._expireTracker) {
            this._expireTracker.restart();
        }
    }

    reset() {
        if (this.hasValue && this._instance && this._disposer) {
            this._disposer(this._instance);
        }
        this.setInstance(undefined);
    }

    dispose() { this.reset(); }
}
