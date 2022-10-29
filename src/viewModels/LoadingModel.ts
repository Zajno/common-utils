import { NumberModel } from './NumberModel';
import { IResetableModel, IValueModel } from './types';

export class LoadingModel implements IValueModel<boolean>, IResetableModel {

    private readonly _number = new NumberModel(0);

    public get isLoading() { return this._number.value > 0; }

    public get value(): boolean { return this.isLoading; }
    public set value(v: boolean) {
        if (v) {
            this._number.increment();
        } else {
            this._number.decrement();
        }
    }

    public async useLoading<T>(cb: () => (T | Promise<T>)): Promise<T>;
    public async useLoading<T>(cb: () => (T | Promise<T>), exclusive: false): Promise<T>;
    public async useLoading<T>(cb: () => (T | Promise<T>), exclusive: true): Promise<T | false>;
    public async useLoading<T>(cb: () => (T | Promise<T>), exclusive: 'throw'): Promise<T>;

    public useLoading<T>(cb: () => (T | Promise<T>), exclusive: boolean | 'throw' = false): Promise<T | false> {
        return withLoading(this, cb, exclusive as any);
    }

    public reset = () => this._number.reset();
}

export function withLoading<T>(model: IValueModel<boolean>, cb: () => (T | Promise<T>)): Promise<T>;
export function withLoading<T>(model: IValueModel<boolean>, cb: () => (T | Promise<T>), exclusive: false): Promise<T>;
export function withLoading<T>(model: IValueModel<boolean>, cb: () => (T | Promise<T>), exclusive: true): Promise<T | false>;
export function withLoading<T>(model: IValueModel<boolean>, cb: () => (T | Promise<T>), exclusive: 'throw'): Promise<T>;
export function withLoading<T>(model: IValueModel<boolean>, cb: () => (T | Promise<T>), exclusive: boolean | 'throw'): Promise<T | false>;

export async function withLoading<T>(this: void, model: IValueModel<boolean>, cb: () => (T | Promise<T>), exclusive: boolean | 'throw' = false): Promise<T | false> {
    if (exclusive && model.value) {
        if (exclusive === 'throw') {
            throw new Error('Operation cannot be started because another one is in progress already.');
        }
        return false;
    }

    model.value = true;

    try {
        const res = await cb();
        return res;
    } finally {
        model.value = false;
    }
}
