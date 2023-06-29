
type Primitive = number | string | Symbol | boolean | null | undefined | bigint;

export type DeepReadonly<T extends Object> = {
    readonly [P in keyof T]: T[P] extends (Function | Primitive)
        ? T[P]
        : (T[P] extends Object
            ? DeepPartial<T[P]>
            : T[P]
        );
};

export type DeepPartial<T extends Object> = {
    [P in keyof T]?: T[P] extends (Function | Primitive)
        ? T[P]
        : (T[P] extends Object
            ? DeepPartial<T[P]>
            : T[P]
        );
};

export type DeepRequired<T extends Object> = {
    [P in keyof T]-?: T[P] extends (Function | Primitive)
        ? T[P]
        : (T[P] extends Object
            ? DeepRequired<T[P]>
            : T[P]
        );
};

export type DeepMutable<T extends Object> = {
    -readonly [P in keyof T]: T[P] extends (Function | Primitive)
        ? T[P]
        : (T[P] extends Object
            ? DeepMutable<T[P]>
            : T[P]
        );
};
