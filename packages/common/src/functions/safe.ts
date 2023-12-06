
export function catchPromise(promise: any, cb?: (err: any) => void) {
    Promise.resolve(promise).catch(err => cb?.(err));
}
