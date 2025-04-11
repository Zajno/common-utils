import type { EmptyObject, LengthArray, Nullable } from '../../types/misc.js';
import type { CombineOptions } from './utils.js';

export type ArgValue = string | number;

export type ObjectBuilderArgs<TArgs extends string> = string extends TArgs ? EmptyObject : Record<TArgs, ArgValue>;
export type BuilderArgs<TArgs extends string, L extends number = number> = LengthArray<ArgValue, L> | Record<TArgs, ArgValue>;
export type TemplatePrefixing = Nullable<string | ((key: string, index: number) => string)>;

interface BaseBuilder<A extends readonly string[], B, P = TemplatePrefixing> {
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
     * - add a prefix for each key in case `prefix` is provided as string
     * - format each key in case `prefix` is provided as function
     *
     * For now it's recommended to cache the result, internally it doesn't care about it.
     */
    template: (prefix?: P, options?: CombineOptions) => string;

    /** args as they were in the template */
    readonly args: A;

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

export type TransformMap<A extends readonly string[]> = {
    [K in A[number]]?: (v: ArgValue) => string;
};

type EmptyBuilderArgs = [] | Record<PropertyKey, never>;

type ReadonlyArr<TArr extends ReadonlyArray<any>> = TArr extends ReadonlyArray<infer T> ? ReadonlyArray<T> : never;

export interface Builder<TArgs extends readonly string[]> extends BaseBuilder<ReadonlyArr<TArgs>, BuilderArgs<TArgs[number], TArgs['length']>> { }
export interface StaticBuilder extends BaseBuilder<readonly [], EmptyBuilderArgs> { }
export interface IBuilder extends BaseBuilder<readonly string[], any> { }

export type StaticInput = string // static one-component path
    | readonly string[]; // static multi-component path, will be joined with '/' (by default)

export type BaseInput = StaticInput | BaseBuilder<any, any, any>;

export type Output<TInput> = TInput extends StaticBuilder
    ? StaticBuilder
    : (TInput extends Builder<infer TArgs>
        ? Builder<TArgs>
        : StaticBuilder
    );

export type SwitchBuilder<TArg extends readonly string[]> = [TArg] extends [never]
    ? StaticBuilder
    : ([] extends TArg
        ? StaticBuilder
        : (readonly string[] extends TArg
            ? IBuilder
            : Builder<TArg>
        )
    );

export type ExtractArgs<T> = T extends Builder<infer TArgs> ? TArgs : readonly string[];

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
    ? (CombineTwo<T1, T2> extends infer C extends BaseBuilder<any, any> & BaseInput
        ? (Rest extends readonly BaseInput[]
            ? CombineBuilders<readonly [C, ...Rest]>
            : never
        ) : never
    ) : (T extends readonly [infer T1]
        ? Output<T1>
        : StaticBuilder
    );
