import { Nullable } from '../types';

type LaxPromise<T> = Promise<T> | T | void;

export function catchPromise(promise: LaxPromise<any>, cb?: (err: any) => void) {
    Promise.resolve(promise).catch(err => cb?.(err));
}

export function wrapAsync<T, TArgs extends any[]>(fn: Nullable<(...args: TArgs) => LaxPromise<T>>, cb?: (err: any) => void): (...args: TArgs) => void {
    return (...args: TArgs) => {
        if (fn) {
            catchPromise(fn(...args), cb);
        }
    };
}
