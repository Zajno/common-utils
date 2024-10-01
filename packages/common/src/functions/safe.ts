import { Nullable } from '../types';

export function catchPromise(promise: Promise<any> | void, cb?: (err: any) => void) {
    Promise.resolve(promise).catch(err => cb?.(err));
}

export function wrapAsync<T, TArgs extends any[]>(fn: Nullable<(...args: TArgs) => Promise<T>>, cb?: (err: any) => void): (...args: TArgs) => void {
    return (...args: TArgs) => {
        if (fn) {
            catchPromise(fn(...args), cb);
        }
    };
}
