import { IEndpointInfo } from './endpoint.types.js';
import type { ApiCaller, EndpointCallArgs, GenericApiCaller } from './call.js';
import { ApiEndpoint } from './endpoint.js';
import { assert } from '../functions/assert.js';
import { getTemplate } from './helpers.js';

export type IEndpointCaller<T extends IEndpointInfo, TExtra extends object = Record<string, any>> = ApiCaller<T, TExtra> & {
    readonly Endpoint: T;
};

export type ApiDefinition = IEndpointInfo | {
    [key: string]: ApiDefinition;
};

export type ApiRunner<T, TExtra extends Record<string, any>> = T extends IEndpointInfo
    ? IEndpointCaller<T, TExtra>
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

    if (ApiEndpoint.isEndpoint(api)) {
        return createEndpointCallable(api, caller as GenericApiCaller) as ApiRunner<typeof api, TExtra>;
    }

    return Object.entries(api).reduce((acc, [key, value]) => {
        const next = value;
        if (next != null && typeof next === 'object') {
            acc[key] = buildApi(next, caller);
        }
        return acc;
    }, {} as Record<string, ApiRunner<any, TExtra>>) as ApiRunner<TApi, TExtra>;
}

/** Partial application: binding an endpoint to callApi, so only input data and extra are passed to a newly created function. */
export function createEndpointCallable<
    TEndpoint extends IEndpointInfo,
    TCaller extends GenericApiCaller<TExtra>,
    TExtra extends object = Record<string, any>,
>(endpoint: TEndpoint, caller: TCaller) {
    const path = getTemplate(endpoint).replaceAll('/', '_').replaceAll(':', '$') || 'root';
    const name = `${endpoint.displayName || '?'}_${endpoint.method}_${path}`;

    const fn = {
        [name]: function (data: EndpointCallArgs<TEndpoint>, extra?: Parameters<TCaller>[2]) { return caller<TEndpoint>(endpoint, data, extra); },
    }[name]; // this sets the name of the function

    const result = fn as IEndpointCaller<TEndpoint, TExtra>;
    Object.assign(result, { Endpoint: endpoint });
    return result;
}
