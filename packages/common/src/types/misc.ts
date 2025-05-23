
export type Predicate<T> = (value: T) => boolean;

/** Type for extracting only string keys from T (skips number & symbol keys) */
export type StringKeys<T extends AnyObject> = {
    [K in keyof T]: K extends string ? K : never;
}[keyof T];

/** Type for extracting string keys of type `T` values of each are of certain type `K` */
export type TypedKeys<T extends AnyObject, K> = {
    [P in StringKeys<T>]: T[P] extends K ? P : never;
}[StringKeys<T>];

/** Type for extraction only keys, values of which are functions with certain args and return result */
export type FunctionKeys<T extends AnyObject, TArgs extends any[] = any[], TRes = any> = TypedKeys<T, (...args: TArgs) => TRes>;

export type ArrayTail<T> = T extends [any, ...infer P] ? [...P] : T;

export type NestedPick<T, K extends ReadonlyArray<any>> = K extends ReadonlyArray<never> // empty arr
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
        : (R['length'] extends N
            ? R
            : LengthArray<T, N, [T, ...R]>
        );

export type EmptyArray = [] & { length: 0 };
export type NonEmptyArray<T = any> = T[] & { 0: T; };

export type AnyObject = Record<string, any>;
export type EmptyObject = Record<PropertyKey, never>;
export type AnyFunction = (...args: any[]) => any;
export type Primitive = number | string | symbol | boolean | null | undefined | bigint;
export type ObjectOrPrimitive = AnyObject | Primitive;

export type ToPlainObject<T> = T extends (AnyFunction | Primitive)
    ? never
    : (T extends AnyObject
        ? T
        : never
    );

export type Nullable<T> = T | null | undefined;

export type PickNullable<T, K extends keyof T> = {
    [P in K]?: Nullable<T[P]>;
};

export type EmptyObjectNullable = (EmptyObject | null | undefined);
export type IsNever<T, Y, N> = [T] extends [never] ? Y : N;
export type Coalesce<T, TReplace = EmptyObjectNullable> = [T] extends [never] | [null] | [undefined]
    ? TReplace
    : T
;

/** Intellisense helper to show type unions/intersections as a whole type */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
