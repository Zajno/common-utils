
type Primitive = number | string | Symbol | boolean | null | undefined | bigint;

export type DeepReadonly<T extends Object> = Object & {
    readonly [P in keyof T]: T[P] extends (Function | Primitive)
        ? T[P]
        : (T[P] extends Array<infer U>
            ? ReadonlyArray<DeepReadonly<U>>
            : (T[P] extends Object
                ? DeepReadonly<T[P]>
                : T[P]
            )
        );
};

export type DeepPartial<T extends Object> = Object & {
    [P in keyof T]?: T[P] extends (Function | Primitive)
        ? T[P]
        : (T[P] extends Object
            ? DeepPartial<T[P]>
            : T[P]
        );
};

export type DeepRequired<T extends Object> = Object & {
    [P in keyof T]-?: T[P] extends (Function | Primitive)
        ? T[P]
        : (T[P] extends Object
            ? DeepRequired<T[P]>
            : T[P]
        );
};

export type DeepMutable<T extends Object> = Object & {
    -readonly [P in keyof T]: T[P] extends (Function | Primitive)
        ? T[P]
        : (T[P] extends ReadonlyArray<infer U>
            ? Array<DeepMutable<U>>
            : (T[P] extends Object
                ? DeepMutable<T[P]>
                : T[P]
            )
        );
};

export type DeepReadonlyPartial<T extends Object> = Object & {
    readonly [P in keyof T]?: T[P] extends (Function | Primitive)
        ? T[P]
        : (T[P] extends Array<infer U>
            ? ReadonlyArray<DeepReadonlyPartial<U>>
            : (T[P] extends Object
                ? DeepReadonlyPartial<T[P]>
                : T[P]
            )
        );
};
