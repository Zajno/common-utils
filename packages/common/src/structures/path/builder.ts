import { constructDynamic,
    constructStatic,
    guardIsStatic,
    normalizeInput,
} from './builder.helpers.js';
import type {
    TemplateTransform,
    TransformMap,
} from './types.helpers.js';
import type {
    BaseInput,
    Builder,
    BuilderArgs,
    CombineBuilders,
    SwitchBuilder,
} from './types.js';
import { CombineOptions, combineUrls } from './utils.js';

export type * from './types.js';
export type { TemplateTransform } from './types.helpers.js';

/** Tagged template literal to create a path builder */
export function build<TArgs extends string[]>(
    strings: TemplateStringsArray,
    ...params: TArgs
): SwitchBuilder<TArgs> {
    return constructDynamic(
        strings,
        ...params,
    ) as SwitchBuilder<TArgs>;
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
export function construct<TArr extends BaseInput[]>(...inputsRaw: TArr): CombineBuilders<TArr> {
    const inputs = normalizeInput(inputsRaw);
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
        return convertToOutput(inputs[0]) as unknown as CombineBuilders<TArr>;
    }

    const outputs = inputs.map(convertToOutput);
    const args = outputs.map(o => o.args).flat();

    const skipOuterOptions = (options: CombineOptions | undefined): CombineOptions | undefined => {
        if (!options) {
            return options;
        }
        const { addStart: _, addTrail: __, ...rest } = options;
        return rest;
    };

    const result = {
        build: (args: BuilderArgs<string, number>, options?: CombineOptions) => {
            const innerOptions = skipOuterOptions(options);
            let outputResults: string[];
            if (Array.isArray(args)) {
                // if args is array, we need to split it into parts so each `output` will get its own args
                let usedArgsCount = 0;
                outputResults = outputs.map(o => {
                    const currentArgs = args.slice(usedArgsCount, usedArgsCount + o.args.length);
                    usedArgsCount += o.args.length;
                    return o.build(currentArgs, innerOptions);
                });
            } else {
                // in case of object we don't have to split args
                outputResults = outputs.map(o => o.build(args, innerOptions));
            }

            return combineUrls(options, ...outputResults);
        },
        template: (prefix: TemplateTransform, options?: CombineOptions) => {
            const innerOptions = skipOuterOptions(options);
            return combineUrls(options, ...outputs.map(o => o.template(prefix, innerOptions)));
        },
        args,
        as() { return this as any; },
        asOptional() { return this as any; },
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
