import type { IDisposable } from '../functions/disposer';

export class LazyPromise<T> implements IDisposable {

    private _instance: T = undefined;
    private _busy: boolean = null;

    private _promise: Promise<T> = null;

    constructor(
        private readonly _factory: () => Promise<T>,
        private readonly initial: T = undefined,
    ) {
        this._instance = initial;
    }

    get busy() { return this._busy || false; }
    get hasValue() { return this._busy === false; }

    get promise() {
        this.ensureInstanceLoading();
        return this._promise;
    }

    get value() {
        this.ensureInstanceLoading();
        return this._instance;
    }

    protected ensureInstanceLoading() {
        if (this._busy === null) {
            this._busy = true;
            this._promise = this._factory();
            this._promise.then(this.setInstance);
        }
    }

    private setInstance = (res: T) => {
        this._busy = false;
        this._instance = res || null;

        // keep this._promise to allow to re-use it outside
    };

    reset() {
        this._busy = null;
        this._instance = this.initial;
        this._promise = null;
    }

    dispose = () => this.reset();
}
