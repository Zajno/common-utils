
type Primitive = number | string | Symbol | boolean | null | undefined | bigint;

export type DeepReadonly<T> = T extends (Function | Primitive)
    ? T
    : (
        T extends Object
            ? { readonly [P in keyof T]: DeepReadonly<T[P]>; }
            : T
    );

export type DeepPartial<T> = T extends (Function | Primitive)
    ? T
    : (
        T extends Object
            ? { [P in keyof T]?: DeepPartial<T[P]>; }
            : T
    );
