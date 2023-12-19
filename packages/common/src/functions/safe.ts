
export function catchPromise(promise: Promise<any> | void, cb?: (err: any) => void) {
    Promise.resolve(promise).catch(err => cb?.(err));
}
