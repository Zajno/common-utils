
export type PropertiesOf<T> = Exclude<{
    [K in keyof T]: T[K] extends Function ? never : K
}[keyof T], undefined>;

export type RemoveFunctionFields<T> = {
    readonly [P in PropertiesOf<T>]: T[P];
};
