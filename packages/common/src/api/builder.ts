import { IEndpointInfo } from './endpoint.types.js';
import type { ApiCaller, EndpointCallArgs, GenericApiCaller } from './call.js';
import { ApiEndpoint } from './endpoint.js';
import { assert } from '../functions/assert.js';

type ApiDefinition = IEndpointInfo | {
    [key: string]: ApiDefinition;
};

type ApiRunner<T, TExtra extends Record<string, any>> = T extends IEndpointInfo
    ? ApiCaller<T, TExtra>
    : T extends Record<string, any> ? {
        [K in keyof T]: ApiRunner<T[K], TExtra>;
    } : never;

/** Converts an composite API endpoints object to the same tree of functions */
export function buildApi<TApi extends ApiDefinition, TExtra extends object = Record<string, any>>(
    api: TApi,
    caller: GenericApiCaller<TExtra>,
): ApiRunner<TApi, TExtra> {
    assert(!!api && typeof api === 'object', 'API definition must be an object');
    assert(!!caller && typeof caller === 'function', 'Caller must be a function');

    if (api instanceof ApiEndpoint) {
        return createEndpointCallable(api, caller as GenericApiCaller) as ApiRunner<typeof api, TExtra>;
    }

    return Object.entries(api).reduce((acc, [key, value]) => {
        acc[key] = buildApi(value, caller);
        return acc;
    }, {} as Record<string, ApiRunner<any, TExtra>>) as ApiRunner<TApi, TExtra>;
}

/** Partial application: binding an endpoint to callApi, so only input data and extra are passed to a newly created function. */
export function createEndpointCallable<
    TEndpoint extends ApiEndpoint<TIn, TOut, TPath, TQuery, TErrors, THeaders>,
    TCaller extends GenericApiCaller<TExtra>,
    TIn extends object | null,
    TOut,
    TPath extends readonly string[],
    TQuery extends object,
    TErrors,
    THeaders,
    TExtra extends object = Record<string, any>,
>(endpoint: TEndpoint, caller: TCaller) {
    return (data: EndpointCallArgs<TEndpoint>, extra?: Parameters<TCaller>[2]) =>
        caller<TEndpoint>(endpoint, data, extra);
}
