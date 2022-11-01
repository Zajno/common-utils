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
