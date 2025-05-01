

export type IsOptional<T extends string> = T extends `${string}?`
    ? true
    : false;

export type ToOptional<T extends string> = T extends `${infer Arg}?`
    ? `${Arg}?`
    : `${T}?`;

export type ToOptionalArray<T extends readonly string[]> = T extends readonly [infer Head extends string, ...infer Rest extends readonly string[]]
    ? [ToOptional<Head>, ...ToOptionalArray<Rest>]
    : [];

export type ToRequired<T extends string> = T extends `${infer Arg}?`
    ? Arg
    : T;
export type ToRequiredArray<T extends readonly string[]> = T extends readonly [infer Head extends string, ...infer Rest extends readonly string[]]
    ? [ToRequired<Head>, ...ToRequiredArray<Rest>]
    : T;

export type ReadonlyArrayNormalized<TArr extends ReadonlyArray<unknown>> = TArr extends ReadonlyArray<infer T> ? ReadonlyArray<T> : never;

export type ArgValue = string | number | boolean;

export type ArgumentInfo = {
    raw: string;
    name: string;
    index: number;
    isOptional: boolean;
};

export type TemplateTransformOptions = {
    prefix: string;
    suffix: string;
    optionalSuffix: string;
};

export type TransformFunction<TValue extends ArgValue = ArgValue> = (value: TValue, info: ArgumentInfo) => string;

export type TemplateTransform = string // just prefix
    | Partial<TemplateTransformOptions>
    | TransformFunction<string>;

export type TransformMap<A extends readonly string[]> = {
    [K in A[number]]?: TransformFunction;
};
