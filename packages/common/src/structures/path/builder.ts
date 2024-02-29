import { ArgValue,
    BaseInput,
    Builder,
    Output,
    StaticBuilder,
    StaticInput,
    SwitchBuilder,
    TemplatePrefixing,
} from './types';
import { CombineOptions, combineUrls } from './utils';

export * from './types';

const emptyFactory = (strings: readonly string[]): StaticBuilder => {
    return {
        build: (_, options) => combineUrls(options, ...strings),
        template: (_, options) => combineUrls(options, ...strings),
        args: [],
        as() { return this as any; },
    };
};

/** Tagged template literal to create a path builder */
export function build<TArgs extends string[]>(
    strings: TemplateStringsArray,
    ...params: TArgs
): SwitchBuilder<TArgs> {
    if (params.length === 0) {
        return emptyFactory(strings) as SwitchBuilder<TArgs>;
    }

    type Key = TArgs[number];

    const build = (args: ArgValue[] | Record<Key, ArgValue> | undefined, options?: CombineOptions) => {
        const parts: string[] = [];

        const getValue = !args
            ? (() => null)
            : Array.isArray(args)
                ? (_key: Key, index: number) => args[index]?.toString()
                : (key: Key, _index: number) => args[key]?.toString();

        for (let i = 0; i < strings.length; ++i) {
            parts.push(strings[i]);

            if (i < params.length) {
                const v = getValue(params[i], i);
                if (v != null) {
                    parts.push(v);
                }
            }
        }
        return combineUrls(options, ...parts);
    };

    const template = (prefix?: TemplatePrefixing, options?: CombineOptions): string => {
        let args: string[];

        if (typeof prefix === 'string') {
            args = params.map(p => prefix + p);
        } else if (typeof prefix === 'function') {
            args = params.map(prefix);
        } else {
            args = params;
        }

        return build(args, options);
    };

    const result: Builder<string[]> = {
        build,
        template,
        args: params,
        as() { return this as any; },
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

    const p: string = staticPath;
    const res: StaticBuilder = {
        build: () => p,
        template: () => p,
        args: [],
        as() { return this as any; },
    };
    return res;
};

function guardIsStatic(value: any): value is StaticInput {
    return typeof value === 'string' || Array.isArray(value);
}

/**
 * For input, use static `string | string[]` args to make the path static,
 *
 * or use the `build` (creates `Builder`) tagged template literal to make the path dynamic,
 *
 * or provide `BuilderData` on your own.
*/
export function construct<T extends BaseInput>(input: T): Output<T> {
    if (guardIsStatic(input)) {
        return constructStatic(input) as Output<never>;
    }

    return input as unknown as Output<T>;
}

export const Empty = build``;
