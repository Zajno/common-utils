import { Nullable } from '../../types/misc.js';
import { ArgValue,
    BaseInput,
    Builder,
    BuilderArgs,
    CombineBuilders,
    StaticBuilder,
    StaticInput,
    SwitchBuilder,
    TemplatePrefixing,
    TransformMap,
} from './types.js';
import { CombineOptions, combineUrls } from './utils.js';

export * from './types.js';

const staticFactory = (strings: readonly string[]): StaticBuilder => {
    const parts = strings.slice();
    let defaultOptions = undefined as Nullable<CombineOptions>;
    return {
        build: (_, options) => combineUrls(CombineOptions.merge(defaultOptions, options), ...parts),
        template: (_, options) => combineUrls(CombineOptions.merge(defaultOptions, options), ...parts),
        args: [],
        as() { return this as any; },
        withDefaults(defaults) {
            defaultOptions = defaults;
            return this;
        },
        withBuildTransform() { return this; },
        withTemplateTransform() { return this; },
    };
};

/** Tagged template literal to create a path builder */
export function build<TArgs extends string[]>(
    strings: TemplateStringsArray,
    ...params: TArgs
): SwitchBuilder<TArgs> {
    if (params.length === 0) {
        return staticFactory(strings) as SwitchBuilder<TArgs>;
    }

    type Key = TArgs[number];

    let defaultOptions = undefined as Nullable<CombineOptions>;
    let buildTransforms: TransformMap<string[]> | null = null;
    let templateTransforms: TransformMap<string[]> | null = null;

    const build = (args: ArgValue[] | Record<Key, ArgValue> | undefined, options?: CombineOptions, transforms: Nullable<TransformMap<string[]>> = buildTransforms) => {
        const parts: string[] = [];

        const getValue = !args
            ? (() => null)
            : Array.isArray(args)
                ? (_key: Key, index: number) => args[index]?.toString()
                : (key: Key, _index: number) => args[key]?.toString();

        for (let i = 0; i < strings.length; ++i) {
            parts.push(strings[i]);

            if (i < params.length) {
                let v = getValue(params[i], i);
                if (v != null) {
                    const t = transforms?.[params[i]];
                    if (t) {
                        v = t(v);
                    }

                    parts.push(v);
                }
            }
        }

        return combineUrls(
            CombineOptions.merge(defaultOptions, options),
            ...parts,
        );
    };

    const template = (prefix?: TemplatePrefixing, options?: CombineOptions): string => {
        let args: string[];

        const t = templateTransforms
            ? (v: string) => {
                const t = templateTransforms![v];
                return t ? t(v) : v;
            }
            : (v: string) => v;

        if (typeof prefix === 'string') {
            args = params.map(p => prefix + t(p));
        } else if (typeof prefix === 'function') {
            args = params.map((p, i) => prefix(t(p), i));
        } else {
            args = params.map(t);
        }

        return build(args, options, {});
    };

    const result: Builder<string[]> = {
        build,
        template,
        args: params,
        as() { return this as any; },
        withDefaults(defaults) {
            defaultOptions = defaults;
            return this;
        },
        withBuildTransform(transforms) {
            buildTransforms = transforms;
            return this;
        },
        withTemplateTransform(transforms) {
            templateTransforms = transforms;
            return this;
        },
    };

    return result as SwitchBuilder<TArgs>;
}

const constructStatic = (input: StaticInput): StaticBuilder => {
    let staticPath: string | undefined = undefined;

    /* istanbul ignore else  -- @preserve */
    if (Array.isArray(input)) {
        staticPath = combineUrls(...input);
    } else if (typeof input === 'string') {
        staticPath = input;
    } else {
        throw new Error('Path.construct: Invalid input, expected string | string[]');
    }

    return staticFactory([staticPath]);
};

function guardIsStatic(value: any): value is StaticInput {
    return typeof value === 'string' || Array.isArray(value);
}

export const Empty = build``;

/**
 * For input, use any amount of arguments, each one can be:
 *
 * - static `string | string[]` args to make the path part static
 * - pre-built `Builder` to make the path part dynamic, which can be created by:
 *   - `build` tagged template literal
 *   - manually implementing `Builder<string[]>`
 *   - another `construct` call
*/
export function construct<TArr extends BaseInput[]>(...inputs: TArr): CombineBuilders<TArr> {
    if (!inputs.length) {
        return Empty as CombineBuilders<TArr>;
    }

    const convertToOutput = (input: BaseInput) => {
        if (guardIsStatic(input)) {
            return constructStatic(input) as Builder<string[]>;
        }

        return input as Builder<string[]>;
    };

    if (inputs.length === 1) {
        return convertToOutput(inputs[0]) as CombineBuilders<TArr>;
    }

    const outputs = inputs.map(convertToOutput);
    const args = outputs.map(o => o.args).flat();

    const skipOuterOptions = (options: CombineOptions | undefined): CombineOptions | undefined => {
        if (!options) {
            return options;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { addStart: _, addTrail: __, ...rest } = options;
        return rest;
    };

    const result = {
        build: (args: BuilderArgs<string, number>, options?: CombineOptions) => {
            const innerOptions = skipOuterOptions(options);
            return combineUrls(options, ...outputs.map(o => o.build(args, innerOptions)));
        },
        template: (prefix: TemplatePrefixing, options?: CombineOptions) => {
            const innerOptions = skipOuterOptions(options);
            return combineUrls(options, ...outputs.map(o => o.template(prefix, innerOptions)));
        },
        args,
        as() { return this as any; },
        withDefaults(defaults: CombineOptions) {
            outputs.forEach(o => o.withDefaults(defaults));
            return this;
        },
        withBuildTransform(transforms: TransformMap<string[]>) {
            outputs.forEach(o => o.withBuildTransform(transforms));
            return this;
        },
        withTemplateTransform(transforms: TransformMap<string[]>) {
            outputs.forEach(o => o.withTemplateTransform(transforms));
            return this;
        },
    };
    return result as unknown as CombineBuilders<TArr>;
}
