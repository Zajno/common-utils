import { PostProcessors, PreProcessors } from './register.js';
import { AnyObject } from '../types/index.js';
import { IEndpointInfo } from './endpoint.js';
import { getPath } from './helpers.js';
import type {
    CallerOptions,
    EndpointCallArgs,
    GenericApiCaller,
    RequestConfigDetails,
    RequestExtra,
} from './call.types.js';

export type * from './call.types.js';

export function buildApiCaller<TExtra extends object = Record<string, any>>(options: CallerOptions<TExtra>): GenericApiCaller<TExtra> {

    const { request, hooks = {} } = options;

    return async function callApi<T extends IEndpointInfo>(
        api: T,
        data?: EndpointCallArgs<T> | null,
        extra?: RequestExtra<T> & TExtra,
    ) {
        type TOut = IEndpointInfo.ExtractOut<T>;
        type TIn = IEndpointInfo.ExtractIn<T, object>;

        const {
            headers,
            log = 'res',
            noLoader,
            ...restExtra
        } = extra || {};

        const resultInput = data && { ...data };
        const pathInputs: Record<string, string | number> = {};
        const queryInputs: AnyObject = {};
        let queryStr: string = '';

        // extract path inputs from data
        const pathKeys = api.path?.args;
        if (resultInput && pathKeys?.length) {
            for (const key of pathKeys) {
                pathInputs[key] = resultInput[key];
                delete resultInput[key];
            }
        }

        // extract query inputs from data
        const queryKeysExpected = api.queryKeys;
        if (resultInput && queryKeysExpected?.length) {
            let empty = true;
            for (const key of queryKeysExpected) {
                const v = resultInput[key];
                if (v != null) {
                    queryInputs[key] = v;
                    empty = false;
                }
                delete resultInput[key];
            }

            // compile query string
            if (!empty) {
                const params = new URLSearchParams(queryInputs);
                queryStr = '?' + params.toString();
            }
        }

        if (hooks.beforeConfig) {
            // copy all inputs to avoid mutation
            await hooks.beforeConfig(
                api,
                { ...resultInput } as IEndpointInfo.ExtractIn<T, object>,
                { ...pathInputs } as IEndpointInfo.ExtractPath<T, object>,
                { ...queryInputs } as IEndpointInfo.ExtractQuery<T, object>,
            );
        }

        const sendingData = resultInput && Object.keys(resultInput).length > 0
            ? resultInput
            : undefined;

        const method = api.method || 'GET';
        const config: RequestConfigDetails<T, TIn, TExtra> = {
            method,
            url: getPath(api, pathInputs as IEndpointInfo.ExtractPath<T>) + queryStr,
            data: PreProcessors.process(api, sendingData) || undefined,
            headers: headers as AnyObject || {},
            _api: api,

            _noLoader: noLoader ?? method as string === 'GET',
            _log: log,
            _extra: restExtra as TExtra,
        };

        if (hooks.beforeRequest) {
            const result = await hooks.beforeRequest(config);
            if (result && typeof result === 'object') {
                Object.assign(config, result);
            }
        }

        const response = await request(config) as { data: TOut };
        return PostProcessors.process(api, response?.data);
    };
}
