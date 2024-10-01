
export function catchPromise(promise: Promise<any> | void, cb?: (err: any) => void) {
    Promise.resolve(promise).catch(err => cb?.(err));
}

export function wrapAsync<T, TArgs extends any[]>(fn: (...args: TArgs) => Promise<T>, cb?: (err: any) => void): (...args: TArgs) => void {
    return (...args: TArgs) => {
        catchPromise(fn(...args), cb);
    };
}
