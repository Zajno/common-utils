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
            [P in keyof T]?: DeepPartial<T[P]>;
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
