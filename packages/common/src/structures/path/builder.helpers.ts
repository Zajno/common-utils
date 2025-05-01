import type { Nullable } from '../../types/misc.js';
import type {
    ArgumentInfo,
    ArgValue,
    TemplateTransform,
    TemplateTransformOptions,
    TransformFunction,
    TransformMap,
} from './types.helpers.js';
import type {
    ArgRecord,
    BaseInput,
    Builder,
    StaticBuilder,
    StaticInput,
} from './types.js';
import { CombineOptions, combineUrls } from './utils.js';


export const staticFactory = (strings: readonly string[]): StaticBuilder => {
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

export function constructStatic(input: StaticInput): StaticBuilder & { asOptional?(): never; } {
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

export function constructDynamic(
    strings: TemplateStringsArray,
    ...paramsRaw: string[]
) {
    if (paramsRaw.length === 0) {
        return staticFactory(strings);
    }

    // Collect metadata about parameters
    const params: ArgumentInfo[] = paramsRaw.map((p, index) => {
        const isOptional = p.endsWith(Tokens.Optional);
        return {
            raw: p,
            // Remove optional token from the end of the parameter name
            name: isOptional
                ? p.slice(0, -Tokens.Optional.length)
                : p,
            index,
            isOptional,
        };
    });

    let defaultOptions = undefined as Nullable<CombineOptions>;
    let buildTransforms: TransformMap<string[]> | null = null;
    let templateTransforms: TransformMap<string[]> | null = null;

    const build = (args: (ArgValue | null)[] | ArgRecord<string> | undefined, options?: CombineOptions, transforms: Nullable<TransformMap<string[]>> = buildTransforms) => {
        const parts: string[] = [];

        const getValue: (arg: ArgumentInfo) => Nullable<string> = !args
            ? (() => null)
            : Array.isArray(args)
                ? (arg) => args[arg.index]?.toString()
                : (arg) => (args as Record<string, ArgValue>)[arg.name]?.toString();

        for (let i = 0; i < strings.length; ++i) {
            parts.push(strings[i]);

            if (i >= params.length) {
                continue;
            }

            const info = params[i];
            let v = getValue(info);
            if (v != null) {
                const t = transforms?.[info.name];
                if (t) {
                    v = t(v, info);
                }

                parts.push(v);
            }
        }

        return combineUrls(
            CombineOptions.merge(defaultOptions, options),
            ...parts,
        );
    };

    const template = (transform?: Nullable<TemplateTransform>, options?: CombineOptions): string => {
        const baseTransform: TransformFunction<string> = templateTransforms
            ? (v: string, info: ArgumentInfo) => {
                const t = templateTransforms![info.name];
                return t ? t(v, info) : v;
            }
            : (v: string) => v;

        let resTransform: TransformFunction<string>;

        if (transform && typeof transform === 'function') {
            resTransform = (v, info) => transform(
                baseTransform(v, info),
                info,
            );
        } else {
            const {
                prefix = '',
                suffix = '',
                optionalSuffix = Tokens.Optional,
            }: Partial<TemplateTransformOptions> = typeof transform === 'string'
                ? { prefix: transform }
                : transform || {};

            resTransform = (v, info) => {
                const value = baseTransform(v, info);
                return `${prefix}${value}${info.isOptional ? optionalSuffix : ''}${suffix}`;
            };
        }

        const args = params.map(param => resTransform(param.name, param));

        return build(args, options, {});
    };

    let _args: undefined | (readonly string[]) = undefined;

    const result: Builder<readonly string[]> = {
        build,
        template,
        get args() {
            if (!_args) {
                _args = params.map(p => p.name) as [];
            }
            return _args;
        },
        as() { return this as any; },
        asOptional() {
            return constructDynamic(
                strings,
                ...params.map(p => p.isOptional ? p.raw : `${p.raw}${Tokens.Optional}`),
            ) as any;
        },
        withDefaults(defaults: CombineOptions) {
            defaultOptions = defaults;
            return this;
        },
        withBuildTransform(transforms: TransformMap<string[]>) {
            buildTransforms = transforms;
            return this;
        },
        withTemplateTransform(transforms: TransformMap<string[]>) {
            templateTransforms = transforms;
            return this;
        },
    };

    return result;
}

const Tokens = {
    Separator: '/',
    Optional: '?',
    Arg: ':',
};

export function guardIsStatic(value: any): value is StaticInput {
    return typeof value === 'string' || Array.isArray(value);
}

export function normalizeInput(inputs: BaseInput[]): BaseInput[] {
    if (!inputs.length) {
        return [];
    }

    const normalizeString = (input: string): BaseInput => {
        const part = input.trim();
        if (part.startsWith(Tokens.Arg)) {
            const cleaned = part.slice(Tokens.Arg.length);
            return constructDynamic`${cleaned}`;
        }
        return part;
    };

    const extractParts = (input: string): BaseInput | BaseInput[] => {
        if (input.includes(Tokens.Separator)) {
            return input.split(Tokens.Separator)
                .map(normalizeString)
                .filter(Boolean);
        }
        return normalizeString(input);
    };

    return inputs.map(input => {
        if (typeof input === 'string') {
            return extractParts(input);
        }

        if (Array.isArray(input)) {
            return input.map(i => {
                if (typeof i === 'string') {
                    return extractParts(i);
                }
                return i;
            });
        }

        return input;
    }).flat();
}
