import type { AnyFunction } from './misc.js';

export type TypedFn<A extends unknown[], R> = (...args: A) => R;

export type Asyncify<T> = {
    [P in keyof T]: T[P] extends TypedFn<unknown[], Promise<unknown>>
        ? T[P]
        : (T[P] extends TypedFn<infer A, infer R>
            ? (...args: A) => Promise<R>
            : T[P]
        )
};

export type Awaitify<T> = {
    [P in keyof T]: T[P] extends TypedFn<infer A, Promise<infer R>>
        ? (...args: A) => R
        : T[P];
};


export type PropertiesOf<T> = Exclude<{
    [K in keyof T]: T[K] extends AnyFunction ? never : K
}[keyof T], undefined>;

export type RemoveFunctionFields<T> = {
    readonly [P in PropertiesOf<T>]: T[P];
};

export type RemoveFirstParameter<T> = T extends (a: any, ...args: infer A) => infer R
    ? (...args: A) => R
    : T;
