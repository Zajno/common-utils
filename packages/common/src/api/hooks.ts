import type { Nullable } from '../types/misc.js';
import type { CallerResponse, IRequestConfig } from './call.types.js';
import type { IEndpointInfo } from './endpoint.types.js';

export type CallerHooks<TExtra extends object = object> = {
    /**
    * Called before config is created, to validate result input data.
    * May throw to abort request. Use for input validation if needed.
    * Objects are cloned to avoid mutation.
    */
    beforeConfig?: <T extends IEndpointInfo = IEndpointInfo>(
        api: T,
        body: IEndpointInfo.ExtractIn<T, object>,
        pathParams: IEndpointInfo.ExtractPath<T, object>,
        queryParams: IEndpointInfo.ExtractQuery<T, object>,
    ) => CallerHooks.HookReturnType;

    /**
     * Called before request is sent.
     * The config can be mutated or returned as updated object – in the latter case it will be merged into original config via `Object.assign`.
     * This is useful for adding headers or modifying request data.
     */
    beforeRequest?: <
        T extends IEndpointInfo = IEndpointInfo,
        TIn = IEndpointInfo.ExtractIn<T>,
    >(config: IRequestConfig<T, TIn, TExtra>) => CallerHooks.HookReturnType<void | IRequestConfig<T, TIn, TExtra>>;

    /**
     * Called after response is receieved.
     * The config can be mutated or returned as updated object – in the latter case it will be merged into original config via `Object.assign`.
     * This is useful for adding headers or modifying request data.
     */
    afterResponse?: <
        T extends IEndpointInfo = IEndpointInfo,
        TIn = IEndpointInfo.ExtractIn<T>,
        TOut = IEndpointInfo.ExtractOut<T>,
        TResponse extends CallerResponse<TOut> = CallerResponse<TOut>,
    >(config: IRequestConfig<T, TIn, TExtra>, response: TResponse) => CallerHooks.HookReturnType<void | TResponse>;
};

export namespace CallerHooks {

    export type HookReturnType<T = void> = T | Promise<T>;

    type HookAdapter<TExtra extends object, K extends keyof CallerHooks<TExtra>, H extends NonNullable<CallerHooks<TExtra>[K]> = NonNullable<CallerHooks<TExtra>[K]>> = (prev: ReturnType<H>, nextFn: H, ...args: Parameters<H>) => ReturnType<H>;

    type HookAdaptersMap<TExtra extends object> = {
        [K in keyof CallerHooks<TExtra>]?: HookAdapter<TExtra, K>;
    };

    // by default, no adapter, previous value is not affecting the next one
    const Adapters: HookAdaptersMap<object> = {
        beforeRequest: async (prev, next, arg) => next(await prev ?? arg),
        afterResponse: async (prev, next, config, response) => {
            const nextResponse = await prev ?? response;
            return next(config, nextResponse as any);
        },
    };

    export function merge<TExtra extends object>(items: Nullable<CallerHooks<TExtra> | CallerHooks<TExtra>[]>): CallerHooks<TExtra> {
        const result: CallerHooks<TExtra> = { };
        if (!items) {
            return result;
        }

        if (!Array.isArray(items)) {
            Object.assign(result, items);
            return result;
        }

        type CH = CallerHooks<TExtra>;


        const mergeOne = <K extends keyof CH, H extends NonNullable<CH[K]>>(
            key: K,
            value: Nullable<H>,
            adapter?: (prev: ReturnType<H>, nextFn: H, ...args: Parameters<H>) => ReturnType<H>,
        ) => {
            if (!value) {
                return;
            }

            const current = result[key];
            if (!current) {
                result[key] = value;
                return;
            }

            type HookType = (...args: Parameters<H>) => ReturnType<H>;

            const prevHook = current as HookType;
            const nextHook = value as HookType;

            const res = async (...args: Parameters<H>) => {
                const prev = await prevHook(...args);
                if (!adapter) {
                    return nextHook(...args);
                }

                return adapter(
                    prev,
                    value,
                    ...args,
                );
            };

            result[key] = res as CH[K];
        };

        items.forEach(item => {
            Object.entries(item).forEach(([k, value]) => {
                if (!value) {
                    return;
                }

                const key = k as keyof CH;
                mergeOne(key, value as CH[typeof key], Adapters[key] as HookAdapter<TExtra, typeof key>);
            });
        });

        return result;
    }
}
