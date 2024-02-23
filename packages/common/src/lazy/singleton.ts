import type { IDisposable } from '../functions/disposer';
import type { LazyLight } from './light';

export class Lazy<T> implements IDisposable, LazyLight<T> {

    protected _instance: T | null = null;

    constructor(
        protected readonly _factory: (() => T),
        protected readonly _disposer?: (prev: T) => void,
    ) {

    }

    get hasValue() { return this._instance !== null; }

    get value() {
        this.ensureInstance();
        return this._instance!;
    }

    /** Override me: additional way to make sure instance is valid */
    protected get isValid() { return this.hasValue; }

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

    setInstance = (instance: T | null) => {
        this._instance = instance;
    };

    reset() {
        if (this.hasValue && this._instance && this._disposer) {
            this._disposer(this._instance);
        }
        this.setInstance(null);
    }

    dispose() { this.reset(); }
}
