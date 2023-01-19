export * from './deep';
export * from './getter';
export * from './comparator';

export type Predicate<T> = (value: T) => boolean;

export type TypedKeys<T extends Object, K> = {
    [P in keyof T]: T[P] extends K ? P : never
}[keyof T];

export type ArrayTail<T> = T extends [any, ...infer P] ? [...P] : T;

export type NestedPick<T, K extends any[]> = K extends Array<never> // empty arr
    ? T
    : {
        [P in K[0]]: P extends keyof T ? NestedPick<T[P], ArrayTail<K>> : never;
    };

export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

// Source: https://stackoverflow.com/a/74801694
export type LengthArray<
        T,
        N extends number,
        R extends T[] = []
    > = number extends N
        ? T[]
        : R['length'] extends N
        ? R
        : LengthArray<T, N, [T, ...R]>;
