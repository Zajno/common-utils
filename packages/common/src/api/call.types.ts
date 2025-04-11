import type { AnyObject } from '../types/misc.js';
import type { IEndpointInfo } from './endpoint.types.js';
import type { LogTypes } from './logging.js';
import type { EndpointMethods } from './methods.js';

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

export type CallerOptions<TExtra extends object = Record<string, any>> = {
    /** Request implementation */
    request: <TIn, TOut>(config: RequestConfigDetails<IEndpointInfo, TIn, TExtra>) => Promise<{ data: TOut }>;

    hooks?: {
        /**
         * Called before config is created, to validate result input data.
         * May throw to abort request. Use for input validation if needed.
         */
        beforeConfig?: <T extends IEndpointInfo = IEndpointInfo>(
            api: T,
            body: IEndpointInfo.ExtractIn<T, object>,
            pathParams: IEndpointInfo.ExtractPath<T, object>,
            queryParams: IEndpointInfo.ExtractQuery<T, object>,
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

export type EndpointCallArgs<T extends IEndpointInfo> = IEndpointInfo.ExtractIn<T, object>
    & IEndpointInfo.ExtractPath<T, object>
    & IEndpointInfo.ExtractQuery<T, object>;

type IEndpointNoArgs = IEndpointInfo.Base
    & (IEndpointInfo.IPath<readonly string[]> | IEndpointInfo.IPathAbstract)
    & IEndpointInfo.IIn<null>
    & IEndpointInfo.IQuery<AnyObject>;

export interface GenericApiCaller<TExtra extends object = Record<string, any>> {
    <T extends IEndpointInfo>(api: T, data: EndpointCallArgs<T>, extra?: RequestExtra<T> & TExtra): Promise<IEndpointInfo.ExtractOut<T>>;
    <T extends IEndpointNoArgs>(api: T, data?: undefined, extra?: RequestExtra<T> & TExtra): Promise<IEndpointInfo.ExtractOut<T>>;
}

export type ApiCaller<TEndpoint extends IEndpointInfo, TExtra extends object = Record<string, any>> = TEndpoint extends IEndpointNoArgs
    ? (data?: undefined, extra?: RequestExtra<TEndpoint> & TExtra) => Promise<IEndpointInfo.ExtractOut<TEndpoint>>
    : (data: EndpointCallArgs<TEndpoint>, extra?: RequestExtra<TEndpoint> & TExtra) => Promise<IEndpointInfo.ExtractOut<TEndpoint>>;
