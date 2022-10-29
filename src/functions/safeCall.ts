
export function safeCall<T extends (...args: any) => any>(cb: T | undefined, ...args: Parameters<T>): ReturnType<T> | void {
    if (cb) {
        return cb.apply(null, args);
    }
}
