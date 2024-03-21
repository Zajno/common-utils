import { PostProcessors, PreProcessors } from './register';
import { AnyObject } from '../types';
import { IEndpointInfo } from './endpoint';
import { EndpointMethods } from './methods';
import { LogTypes } from './logging';
import { getPath } from './helpers';

type Extra<T> = {
    headers?: IEndpointInfo.ExtractHeaders<T>;
    log?: LogTypes<IEndpointInfo.ExtractIn<T>, IEndpointInfo.ExtractOut<T>>;
    noLoader?: boolean;
};

export type RequestConfig<TIn> = {
    method: EndpointMethods | string & Record<never, never>;
    url: string;
    data: TIn | null | undefined;
    headers: AnyObject;
};

export type RequestConfigDetails<T extends IEndpointInfo = IEndpointInfo, TIn = IEndpointInfo.ExtractIn<T>> = RequestConfig<TIn> & {
    _api: T;
    _noLoader?: boolean;
    _log?: LogTypes;
};

type CallerOptions = {
    bodyValidation?: (api: IEndpointInfo, input: any) => Promise<void>;
    request: <TIn, TOut>(config: RequestConfigDetails<IEndpointInfo, TIn>) => Promise<{ data: TOut }>;
};

export type EndpointCallArgs<T extends IEndpointInfo> = IEndpointInfo.ExtractIn<T> | IEndpointInfo.ExtractPath<T> | IEndpointInfo.ExtractQuery<T>;

export function buildApiCaller(options: CallerOptions) {

    const { bodyValidation, request } = options;

    return async function callApi<T extends IEndpointInfo>(
        api: T,
        data: EndpointCallArgs<T>,
        extra?: Extra<T>,
    ) {

        type TOut = IEndpointInfo.ExtractOut<T>;

        const { headers, log = 'res' } = extra || {};

        const resultInput = data && { ...data } as IEndpointInfo.ExtractIn<T>;
        const pathInputs: Record<string, string | number> = {};
        let queryStr: string = '';

        const pathKeys = api.pathBuilder.args;
        if (resultInput && pathKeys?.length) {
            for (const key of pathKeys) {
                pathInputs[key] = resultInput[key];
                delete resultInput[key];
            }
        }

        const queryKeysExpected = api.queryKeys;
        if (resultInput && queryKeysExpected?.length) {
            const queryInputs: AnyObject = {};
            let empty = true;
            for (const key of queryKeysExpected) {
                const v = resultInput[key];
                if (v != null) {
                    queryInputs[key] = v;
                    empty = false;
                }
                delete resultInput[key];
            }

            if (!empty) {
                const params = new URLSearchParams(queryInputs);
                queryStr = '?' + params.toString();
            }
        }

        if (resultInput && bodyValidation) {
            await bodyValidation(api, resultInput);
        }

        const sendingData = resultInput && Object.keys(resultInput).length > 0
            ? resultInput
            : undefined;

        const method = api.method || 'GET';
        const config: RequestConfigDetails<T> = {
            method,
            url: getPath(api, pathInputs as IEndpointInfo.ExtractPath<T>) + queryStr,
            data: PreProcessors.process(api, sendingData) || undefined,
            headers: headers as AnyObject || {},
            _api: api,
            _noLoader: extra?.noLoader == null ? method as string === 'GET' : extra.noLoader,
            _log: log,
        };

        if (api.isForm) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }

        const response = await request(config) as { data: TOut };
        return PostProcessors.process(api, response.data);
    };
}
