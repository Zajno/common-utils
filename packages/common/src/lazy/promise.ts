import type { IDisposable } from '../functions/disposer';
import type { ILazy, LazyLight } from './light';

export type ILazyPromise<T> = ILazy<T> & {
    readonly busy: boolean;
    readonly promise: Promise<T>;
};

export class LazyPromise<T> implements IDisposable, LazyLight<T>, ILazyPromise<T> {

    private _instance: T | undefined = undefined;
    private _busy: boolean | null = null;

    private _promise: Promise<T> | null = null;

    constructor(
        private readonly _factory: () => Promise<T>,
        private readonly initial: T | undefined = undefined,
    ) {
        this._instance = initial;
    }

    get busy() { return this._busy || false; }
    get hasValue() { return this._busy === false; }

    get promise() {
        this.ensureInstanceLoading();
        return this._promise!;
    }

    get value() {
        this.ensureInstanceLoading();
        return this._instance!;
    }

    protected ensureInstanceLoading() {
        if (this._busy === null) {
            this._busy = true;
            this._promise = this._factory().then(this.onResolved);
        }
    }

    protected onResolved = (res: T) => {
        // case: during the promise `setInstance` was called
        if (!this._busy && this._instance !== undefined) {
            return this._instance;
        }
        this.setInstance(res);
        return res;
    };

    public setInstance = (res: T | undefined) => {
        this._busy = false;

        // refresh promise so it won't keep old callbacks
        // + make sure it's resolved with the freshest value
        // also do this before setting the instance... just in case :)
        this._promise = Promise.resolve(res!);

        this._instance = res;

        return res;
    };

    reset = () => {
        this._busy = null;
        this._instance = this.initial;
        this._promise = null;
    };

    dispose = () => this.reset();
}
