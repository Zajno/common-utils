import { AnyFunction, Primitive } from './misc';


export type DeepReadonly<T> = T extends (AnyFunction | Primitive)
    ? T
    : (T extends Array<infer U>
        ? ReadonlyArray<DeepReadonly<U>>
        : {
            readonly [P in keyof T]: DeepReadonly<T[P]>;
        }
    );

export type DeepReadonlyPartial<T> = T extends (AnyFunction | Primitive)
    ? T
    : (T extends Array<infer U>
        ? ReadonlyArray<DeepReadonlyPartial<U>>
        : {
            readonly [P in keyof T]?: DeepReadonlyPartial<T[P]>;
        }
    );

export type DeepPartial<T> = T extends (AnyFunction | Primitive)
    ? T
    : (T extends Array<infer U>
        ? Array<DeepPartial<U>>
        : {
            [P in keyof T]?: DeepPartial<T[P]> | undefined;
        }
    );

export type DeepRequired<T> = T extends (AnyFunction | Primitive)
    ? T
    : (T extends Array<infer U>
        ? Array<DeepRequired<U>>
        : {
            [P in keyof T]-?: DeepRequired<T[P]>;
        }
    );

export type DeepMutable<T> = T extends (AnyFunction | Primitive)
    ? T
    : (T extends ReadonlyArray<infer U>
        ? Array<DeepMutable<U>>
        : {
            -readonly [P in keyof T]: DeepMutable<T[P]>;
        }
    );

export type DeepPickNullable<T, K extends keyof T> = {
    [P in K]?: null | undefined | DeepPartialNullable<T[P]>;
};

export type DeepNullable<T> = T extends (AnyFunction | Primitive)
    ? T
    : (T extends Array<infer U>
        ? Array<DeepNullable<U>>
        : {
            [P in keyof T]: null | DeepNullable<T[P]>;
        }
    );

export type DeepPartialNullable<T> = T extends (AnyFunction | Primitive)
    ? T
    : (T extends Array<infer U>
        ? Array<DeepPartialNullable<U>>
        : {
            [P in keyof T]?: null | undefined | DeepPartialNullable<T[P]>;
        }
    );
