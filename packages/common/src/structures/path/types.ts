import type { LengthArray, Nullable } from '../../types/misc';
import type { CombineOptions } from './utils';

export type ArgValue = string | number;

export type BuilderArgs<TArgs extends string, L extends number = number> = LengthArray<ArgValue, L> | Record<TArgs, ArgValue>;
export type TemplatePrefixing = Nullable<string | ((key: string, index: number) => string)>;

type BaseBuilder<A extends string[], B, P = TemplatePrefixing> = {
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
    args: A;

    /**
     * Types helper method to easily cast all kinds of builders to generic IBuilder or others.
     * It just always returns the passed object, so it's the implementation's responsibility to ensure the compatibility.
     *
     * Currently their signature is totally compatible with each other so this cast is safe.
     *
     * In future probably some extra conversion may be required.
    */
    as<TOther extends BaseBuilder<any, any, any>>(marker?: TOther): TOther;
};

type EmptyBuilderArgs = [] | Record<PropertyKey, never>;

export type Builder<TArgs extends string[]> = BaseBuilder<TArgs, BuilderArgs<TArgs[number], TArgs['length']>>;
export type StaticBuilder = BaseBuilder<[], EmptyBuilderArgs>;
export type IBuilder = BaseBuilder<string[], BuilderArgs<string>>;

export type StaticInput = string // static one-component path
    | string[]; // static multi-component path, will be joined with '/' (by default)

export type ExtractArgs<T> = T extends Builder<infer TArgs> ? TArgs : string;
export type BaseInput = StaticInput | BaseBuilder<any, any, any>;

export type Output<TInput> = TInput extends StaticBuilder
    ? StaticBuilder
    : (TInput extends Builder<infer TArgs>
        ? Builder<TArgs>
        : StaticBuilder
    );

export type SwitchBuilder<TArg extends string[]> = [TArg] extends [never]
    ? StaticBuilder
    : ([] extends TArg
        ? StaticBuilder
        : (string[] extends TArg
            ? IBuilder
            : Builder<TArg>
        )
    );
