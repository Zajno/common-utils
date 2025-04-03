import { Model } from './Model.js';
import type { IResetableModel, IValueModel } from './types.js';

export type LoadingWorker<T> = () => (T | Promise<T>);

export type LoadingResult<T = unknown> = {
    aborted: true;
} | {
    aborted: false;
    result: T;
};

export async function withLoading<T>(this: void, model: IValueModel<boolean>, cb: LoadingWorker<T>, exclusive: boolean | 'throw' = false): Promise<LoadingResult<T>> {
    if (exclusive && model.value) {
        if (exclusive === 'throw') {
            throw new ExclusiveLoadingError();
        }
        return { aborted: true };
    }

    model.value = true;

    try {
        const res = await cb();
        return {
            aborted: false,
            result: res,
        };
    } finally {
        model.value = false;
    }
}

export class LoadingModel implements IValueModel<boolean>, IResetableModel {

    protected readonly _number: IValueModel<number> & IResetableModel;
    protected _firstInit: boolean;

    /**
     * @param useFirstInit - if true, then `isLoading` will be returning 'true' until first `useLoading` call. Defaults to false.
     */
    constructor(useFirstInit = false) {
        this._firstInit = useFirstInit;
        this._number = this.pureConstructNumberModel();
    }

    public get isLoading() { return this.value || this._firstInit; }

    public get value(): boolean { return this._number.value > 0; }

    public set value(v: boolean) {
        this.setValue(v);
    }

    public useLoading<T>(cb: LoadingWorker<T>, exclusive: boolean | 'throw' = false): Promise<LoadingResult<T>> {
        return withLoading(this, cb, exclusive);
    }

    public reset() {
        this._firstInit = false;
        this._number.reset();
    }

    public setValue(isLoading: boolean) {
        if (isLoading) {
            this.incrementLoading();
        } else {
            this._firstInit = false;
            this.decrementLoading();
        }
    }

    /** override me */
    protected incrementLoading() {
        this._number.value++;
    }

    /** override me */
    protected decrementLoading() {
        this._number.value--;
    }

    /** override me
     *
     * Called in the ctor. Should be pure and should NOT access `this`. */
    protected pureConstructNumberModel(): IValueModel<number> & IResetableModel {
        return new Model<number>(0);
    }
}

export class ExclusiveLoadingError extends Error {

    constructor(
        message = 'Operation cannot be started because another one is in progress already.',
        public readonly actionName?: string,
    ) {
        super(message);
    }
}
