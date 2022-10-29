import type { IDisposable } from '../functions/disposer';

export class Lazy<T> implements IDisposable {

    protected _instance: T = null;

    constructor(protected readonly _factory: (() => T)) { }

    get hasValue() { return this._instance !== null; }

    get value() {
        this.ensureInstance();
        return this._instance;
    }

    private ensureInstance() {
        if (this._instance === null) {
            this._instance = this._factory();
        }
    }

    prewarm() {
        this.ensureInstance();
        return this;
    }

    reset() {
        this._instance = null;
    }

    dispose() { this.reset(); }
}
