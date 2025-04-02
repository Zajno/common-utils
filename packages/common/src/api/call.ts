import { PostProcessors, PreProcessors } from './register.js';
import { AnyObject } from '../types/index.js';
import { IEndpointInfo } from './endpoint.js';
import { EndpointMethods } from './methods.js';
import { LogTypes } from './logging.js';
import { getPath } from './helpers.js';

/** Request options to be used by call implementation (e.g. interceptor). Passed as separate object argument to the call method.  */
export type RequestExtra<T> = {
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

/** Compiled request config object passed to `request` implementation */
export type RequestConfigDetails<
    T extends IEndpointInfo = IEndpointInfo,
    TIn = IEndpointInfo.ExtractIn<T>,
    TExtra extends object = Record<string, any>
> = RequestConfig<TIn> & {
    _api: T;
    _noLoader?: boolean;
    _log?: LogTypes;
    /** Additional data passed to the request implementation */
    _extra?: TExtra;
};

type CallerOptions<TExtra extends object = Record<string, any>> = {
    /** Request implementation */
    request: <TIn, TOut>(config: RequestConfigDetails<IEndpointInfo, TIn, TExtra>) => Promise<{ data: TOut }>;

    hooks?: {
        /**
         * Called before config is created, to validate result input data.
         * May throw to abort request. Use for input validation if needed.
         */
        beforeConfig?: <T extends IEndpointInfo = IEndpointInfo>(
            api: T,
            body: IEndpointInfo.ExtractIn<T>,
            pathParams: IEndpointInfo.ExtractPath<T>,
            queryParams: IEndpointInfo.ExtractQuery<T>,
        ) => Promise<void> | void;

        /**
         * Called before request is sent.
         * The config can be mutated or returned as updated object – in the latter case it will be merged into original config via `Object.assign`.
         * This is useful for adding headers or modifying request data.
         */
        beforeRequest?: <
            T extends IEndpointInfo = IEndpointInfo,
            TIn = IEndpointInfo.ExtractIn<T>,
            TExtra extends object = Record<string, any>
        >(config: RequestConfigDetails<T, TIn, TExtra>) => Promise<void> | void | Promise<RequestConfigDetails<T, TIn, TExtra>> | RequestConfigDetails<T, TIn, TExtra>;
    };
};

export type EndpointCallArgs<T extends IEndpointInfo> = IEndpointInfo.ExtractIn<T> | IEndpointInfo.ExtractPath<T> | IEndpointInfo.ExtractQuery<T>;

export type GenericApiCaller<TExtra extends object = Record<string, any>> = ReturnType<typeof buildApiCaller<TExtra>>;
export type ApiCaller<TEndpoint extends IEndpointInfo, TExtra extends object = Record<string, any>> = (data: EndpointCallArgs<TEndpoint>, extra?: RequestExtra<TEndpoint> & TExtra) => Promise<IEndpointInfo.ExtractOut<TEndpoint>>;

export function buildApiCaller<TExtra extends object = Record<string, any>>(options: CallerOptions<TExtra>) {

    const { request, hooks = {} } = options;

    return async function callApi<T extends IEndpointInfo>(
        api: T,
        data: EndpointCallArgs<T>,
        extra?: RequestExtra<T> & TExtra,
    ) {

        type TOut = IEndpointInfo.ExtractOut<T>;
        type TIn = IEndpointInfo.ExtractIn<T>;

        const {
            headers,
            log = 'res',
            noLoader,
            ...restExtra
        } = extra || {};

        const resultInput = data && { ...data } as TIn;
        const pathInputs: Record<string, string | number> = {};
        const queryInputs: AnyObject = {};
        let queryStr: string = '';

        // extract path inputs from data
        const pathKeys = api.path.args;
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
                { ...resultInput },
                { ...pathInputs } as IEndpointInfo.ExtractPath<T>,
                { ...queryInputs } as IEndpointInfo.ExtractQuery<T>,
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
