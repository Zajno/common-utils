
type PropertiesOf<T> = Exclude<{
    [K in keyof T]: T[K] extends Function ? never : K
}[keyof T], undefined>;

export type RemoveFunctionFields<T> = {
    readonly [P in PropertiesOf<T>]: T[P];
};

export function safeCall<T extends (...args: any) => any>(cb: T | undefined, ...args: Parameters<T>): ReturnType<T> | void {
    if (cb) {
        return cb.apply(null, args);
    }
}
