import type { AnyFunction } from './misc.js';

export type DeepReadonly<T> = T extends Array<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : (T extends AnyFunction
        ? T
        : (T extends object
            ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
            : T
        )
    );

export type DeepMutable<T> = T extends ReadonlyArray<infer U>
    ? Array<DeepMutable<U>>
    : (T extends AnyFunction
        ? T
        : (T extends object
            ? { -readonly [P in keyof T]: DeepMutable<T[P]> }
            : T
        )
    );

export type DeepReadonlyPartial<T> = T extends Array<infer U>
    ? ReadonlyArray<DeepReadonlyPartial<U>>
    : (T extends AnyFunction
        ? T
        : (T extends object
            ? { readonly [P in keyof T]?: DeepReadonlyPartial<T[P]> }
            : T
        )
    );

export type DeepPartial<T> = T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : (T extends AnyFunction
        ? T
        : (T extends object
            ? { [P in keyof T]?: DeepPartial<T[P]> }
            : T
        )
    );

export type DeepRequired<T> = T extends Array<infer U>
    ? Array<DeepRequired<U>>
    : (T extends AnyFunction
        ? T
        : (T extends object
            ? { [P in keyof T]-?: DeepRequired<T[P]> }
            : T
        )
    );

export type DeepPickNullable<T, K extends keyof T> = {
    [P in K]?: null | undefined | DeepPartialNullable<T[P]>;
};

export type DeepNullable<T> = T extends Array<infer U>
    ? Array<DeepNullable<U>>
    : (T extends AnyFunction
        ? T
        : (T extends object
            ? { [P in keyof T]: null | DeepNullable<T[P]> }
            : T
        )
    );

export type DeepPartialNullable<T> = T extends object
    ? { [P in keyof T]?: null | undefined | DeepPartialNullable<T[P]>; }
    : (T extends Array<infer U>
        ? Array<DeepPartialNullable<U>>
        : T
    );
