import type { IDisposable } from 'disposer';
import { observable, makeObservable, action } from 'mobx';

export default class Lazy<T> implements IDisposable {

    @observable.ref
    private _instance: T = null;

    constructor(private _factory: (() => T)) {
        makeObservable(this);
    }

    get hasValue() { return this._instance != null; }

    get value() {
        if (!this._instance) {
            this._instance = this._factory();
        }
        return this._instance;
    }

    prewarm() {
        return this.value;
    }

    reset() {
        this._instance = null;
    }

    dispose = () => this.reset();
}

export class LazyPromise<T> implements IDisposable {

    @observable.ref
    private _instance: T = null;

    @observable
    private _busy = false;

    private _loaded = false;
    private _promise: Promise<T> = null;

    constructor(
        private readonly _factory: () => Promise<T>,
        private readonly initial: T = null,
    ) {
        makeObservable(this);
        this._instance = initial;
    }

    get busy() { return this._busy; }

    get promise() {

        return this._promise;
    }

    get() {
        if (!this._loaded && !this._busy) {
            this._busy = true;
            this._promise = this._factory();
            this._promise.then(this.setInstance);
        }

        return this._instance;
    }

    @action
    private setInstance = (res: T) => {
        const wasBusy = this._busy;

        this._busy = false;
        this._loaded = wasBusy;
        this._instance = wasBusy ? res : null;
    };

    @action
    reset() {
        this._busy = false;
        this._instance = this.initial;
        this._loaded = false;
    }

    dispose = () => this.reset();
}
