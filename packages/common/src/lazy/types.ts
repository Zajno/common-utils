import { IDisposable } from '../functions/disposer';
import { IResetableModel } from '../models/types';

export type ILazy<T> = IDisposable & IResetableModel & {
    readonly value: T;
    readonly hasValue: boolean;
    /** should not call the factory or change the value either way */
    readonly currentValue: T | undefined;
};

export type ILazyPromise<T> = ILazy<T> & {
    readonly busy: boolean | null;
    readonly promise: Promise<T>;
};