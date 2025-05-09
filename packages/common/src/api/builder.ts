import { IEndpointInfo } from './endpoint.types.js';
import type { ApiCaller, EndpointCallArgs, GenericApiCaller } from './call.js';
import { ApiEndpoint } from './endpoint.js';
import { assert } from '../functions/assert.js';

export type IEndpointCaller<T extends IEndpointInfo, TExtra extends object = Record<string, any>> = ApiCaller<T, TExtra> & {
    readonly Endpoint: T;
};

export type ApiDefinition = IEndpointInfo | {
    [key: string]: ApiDefinition;
};

export type ApiRemapped<T extends ApiDefinition, TResult> = T extends IEndpointInfo
    ? TResult
    : T extends Record<string, any> ? {
        [K in keyof T]: ApiRemapped<T[K], TResult>;
    } : never;

/** Converts each endpoint in a nested structure to something via transformer */
export function remapApisStructure<TApi extends ApiDefinition, TResult>(root: TApi, transformer: (api: IEndpointInfo) => TResult): ApiRemapped<TApi, TResult> {
    if (ApiEndpoint.isEndpoint(root)) {
        return transformer(root) as ApiRemapped<TApi, TResult>;
    }

    return Object.entries(root).reduce((acc, [key, value]) => {
        const next = value;
        if (next != null && typeof next === 'object') {
            acc[key] = remapApisStructure(next, transformer);
        }
        return acc;
    }, {} as Record<string, ApiRemapped<any, TResult>>) as ApiRemapped<TApi, TResult>;
}

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

    return remapApisStructure(
        api,
        e => createEndpointCallable(e, caller as GenericApiCaller),
    ) as unknown as ApiRunner<TApi, TExtra>;
}

/** Partial application: binding an endpoint to callApi, so only input data and extra are passed to a newly created function. */
export function createEndpointCallable<
    TEndpoint extends IEndpointInfo,
    TCaller extends GenericApiCaller<TExtra>,
    TExtra extends object = Record<string, any>,
>(endpoint: TEndpoint, caller: TCaller) {
    const path = caller.config.getTemplate(endpoint).replaceAll('/', '_').replaceAll(':', '$') || 'root';
    const name = `${endpoint.displayName || '?'}_${endpoint.method}_${path}`;

    const fn = {
        [name]: function (data: EndpointCallArgs<TEndpoint>, extra?: Parameters<TCaller>[2]) { return caller<TEndpoint>(endpoint, data, extra); },
    }[name]; // this sets the name of the function

    const result = fn as IEndpointCaller<TEndpoint, TExtra>;

    // Defining as getter to make readonly according to the interface
    Object.defineProperty(result, 'Endpoint', {
        get: () => endpoint,
    });

    return result;
}
