import type { EmptyObject, Expand, IsNever, LengthArray, Nullable } from '../../types/misc.js';
import type {
    ArgValue,
    IsOptional,
    ReadonlyArrayNormalized,
    TemplateTransform,
    ToOptionalArray,
    ToRequired,
    ToRequiredArray,
    TransformMap,
} from './types.helpers.js';
import type { CombineOptions } from './utils.js';


export type ObjectBuilderArgs<TArgs extends string, TFallback = EmptyObject> = string extends TArgs
    ? TFallback
    : ArgRecord<TArgs>;

export type BuilderArgs<TArgs extends string, L extends number = number> = LengthArray<ArgValue | null, L> | ArgRecord<TArgs>;

export type ArgRecord<T extends string> = Expand<{
    [K in T as true extends IsOptional<K> ? never : K]: ArgValue;
} & {
    [K in T as true extends IsOptional<K> ? ToRequired<K> : never]?: ArgValue | null;
}>;

/** Internal, Don't use it directly */
interface BaseBuilder<A extends readonly string[], B> {
    /**
     * Builds the path using provided args.
     *
     * Each arg is always a `ArgValue` (`string | number`), and args are provided as an array which should use the same order and length as the keys in the template.
     *
     * Also, args can be provided as an object with args as they were in the template and values as strings.
     */
    build: (
        args?: B,
        options?: CombineOptions
    ) => string;

    /**
     * Template builder that will build the path using args names but also can:
     * - keep args as they were in the template
     * - add a prefix for each key in case `transform` is provided as string
     * - format each key in case `transform` is provided as function
     * - append prefix/suffix/optional suffix for each key in case `transform` is provided as object
     *
     * For now it's recommended to cache the result, internally it doesn't care about it.
     */
    template: (transform?: Nullable<TemplateTransform>, options?: CombineOptions) => string;

    /** args as they were in the template */
    readonly args: ReadonlyArrayNormalized<ToRequiredArray<A>>;

    /**
     * Types helper method to easily cast all kinds of builders to generic IBuilder or others.
     * It just always returns the passed object, so it's the implementation's responsibility to ensure the compatibility.
     *
     * Currently their signature is totally compatible with each other so this cast is safe.
     *
     * In future probably some extra conversion may be required.
    */
    as<TOther>(marker?: TOther): TOther extends readonly string[]
        ? SwitchBuilder<TOther>
        : (TOther extends BaseBuilder<any, any>
            ? TOther
            : never
        );

    // NOTE: changed cast via params type to support different args via Switcher
    // as<TOther extends BaseBuilder<any, any, any>>(marker?: TOther): TOther;

    /** Allows to specify default combine options for the current builder instance. */
    withDefaults: (defaults: CombineOptions) => this;

    /** Allows to specify **build** transformation per key for the current builder instance. */
    withBuildTransform: (transforms: TransformMap<A>) => this;

    /** Allows to specify **template** transformation per key for the current builder instance. */
    withTemplateTransform: (transforms: TransformMap<A>) => this;
}

type EmptyBuilderArgs = [] | Record<PropertyKey, never>;


export interface Builder<TArgs extends readonly string[]> extends BaseBuilder<
    ReadonlyArrayNormalized<TArgs>,
    BuilderArgs<TArgs[number], TArgs['length']>
> {
    /** Marks input type for `build` to be `Partial`, so any/all arguments can be omitted.
     *
     * **Limitation**: will convert to optional ALL parameters if >=2 Builders combined via CombineBuilders
    */
    asOptional(): Builder<ToOptionalArray<TArgs>>;
}

export interface StaticBuilder extends BaseBuilder<readonly [], EmptyBuilderArgs> { }
export interface IBuilder extends BaseBuilder<readonly string[], any> { }

export type StaticInput = string // static one-component path
    | readonly string[]; // static multi-component path, will be joined with '/' (by default)

export type BaseInput = StaticInput | BaseBuilder<any, any>;

export type SwitchBuilder<TArg extends readonly string[]> = IsNever<
    TArg,
    StaticBuilder,
    [] extends TArg
        ? StaticBuilder
        : (readonly string[] extends TArg
            ? IBuilder
            : Builder<TArg>
        )
>;

export type ExtractArgs<T> = T extends Builder<infer TArgs>
    ? ToRequiredArray<TArgs>
    : readonly string[];

export type ExtractObjectArgs<T, F = EmptyObject> = T extends Builder<infer TArgs>
    ? ObjectBuilderArgs<TArgs[number], F>
    : F;

/** Normalizes builder, makes sure dynamic args are inferrable. If input is not a builder (i.e. StaticInput), return StaticBuilder */
type Output<TInput> = TInput extends StaticBuilder
    ? StaticBuilder // already static builder
    : (TInput extends Builder<infer TArgs> // already builder with args
        ? Builder<TArgs>
        : (TInput extends StaticInput
            ? DynamicStringToBuilder<TInput> // convert string to builder
            : StaticBuilder // unknown input, return static builder
        )
    );

// TODO: need to figure out how to combine 2 builders when 1 is optional and the other is not
/** Turns two inputs into one builder, merging static and dynamic args */
type CombineTwo<T1 extends BaseInput, T2 extends BaseInput> = Output<T1> extends StaticBuilder
    ? Output<T2>
    : (Output<T2> extends StaticBuilder
        ? Output<T1>
        : (Output<T1> extends Builder<infer Arr1>
            ? (Output<T2> extends Builder<infer Arr2>
                ? Builder<[...Arr1, ...Arr2]>
                : never)
            : never)
    );

export type CombineBuilders<T extends readonly BaseInput[]> = T extends readonly [infer T1 extends BaseInput, infer T2 extends BaseInput, ...infer Rest]
    ? (CombineTwo<T1, T2> extends infer C extends BaseBuilder<infer _A extends readonly string[], any> & BaseInput
        ? (Rest extends readonly BaseInput[]
            ? CombineBuilders<readonly [C, ...Rest]>
            : never
        ) : never
    ) : (T extends readonly [infer T1]
        ? Output<T1>
        : StaticBuilder
    );

type Splitter<T extends string> = T extends `${infer Head extends string}/${infer Rest}`
    ? [Head, ...Splitter<Rest>]
    : [T];

type ExtractDynamic<T extends string> = T extends `:${infer Arg}`
    ? [Arg]
    : T;

type SkipStaticParts<T extends readonly string[]> = T extends readonly [infer Head extends string, ...infer Rest extends readonly string[]]
    ? ExtractDynamic<Head> extends [infer Arg]
        ? [Arg, ...SkipStaticParts<Rest>]
        : SkipStaticParts<Rest>
    : [];

type ExtractDynamicParts<T extends StaticInput> = T extends readonly string[]
    ? SkipStaticParts<T>
    : (T extends string
        ? SkipStaticParts<Splitter<T>>
        : []
    );

type DynamicStringToBuilder<T extends StaticInput> = [] extends ExtractDynamicParts<T>
    ? StaticBuilder
    : Builder<ExtractDynamicParts<T>>;
