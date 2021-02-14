import { observable, transaction } from 'mobx';

export default class Lazy<T> {

    @observable.ref
    private _instance: T;

    constructor(private _factory: (() => T)) {
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
}

export class LazyPromise<T> {

    @observable.ref
    private _instance: T;

    @observable
    private _busy = false;

    private _loaded = false;

    constructor(
        private readonly _factory: () => Promise<T>,
        private readonly initial: T = null,
    ) {
        this._instance = initial;
    }

    get busy() { return this._busy; }

    get() {
        if (!this._loaded && !this._busy) {
            this._busy = true;
            this._factory().then(res => {
                transaction(() => {
                    this._busy = false;
                    this._loaded = true;
                    this._instance = res;
                });
            });
        }

        return this._instance;
    }

    reset() {
        transaction(() => {
            this._busy = false;
            this._instance = this.initial;
            this._loaded = false;
        });
    }
}
