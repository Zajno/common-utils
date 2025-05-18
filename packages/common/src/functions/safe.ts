import type { Nullable } from '../types/index.js';

type LaxPromise<T> = Promise<T> | T | void;

export function catchPromise(promise: LaxPromise<any>, errorCb?: (err: any) => void) {
    Promise.resolve(promise).catch(err => errorCb?.(err));
}

export function wrapAsync<T, TArgs extends any[]>(fn: Nullable<(...args: TArgs) => LaxPromise<T>>, errorCb?: (err: any) => void): (...args: TArgs) => void {
    return (...args: TArgs) => {
        if (fn) {
            catchPromise(fn(...args), errorCb);
        }
    };
}
