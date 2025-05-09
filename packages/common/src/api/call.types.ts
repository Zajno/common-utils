import type { AnyObject } from '../types/misc.js';
import { EndpointsPathsConfig, type IEndpointsPathsConfig } from './config.js';
import type { IEndpointInfo } from './endpoint.types.js';
import type { LogTypes } from './logging.js';
import type { EndpointMethods } from './methods.js';
import type { CallerHooks } from './hooks.js';

/** Request options to be used by call implementation (e.g. interceptor). Passed as separate object argument to the call method.  */
export type RequestExtra<T> = {
    headers?: IEndpointInfo.ExtractHeaders<T>;
    log?: LogTypes<IEndpointInfo.ExtractIn<T>, IEndpointInfo.ExtractOut<T>>;
    noLoader?: boolean;
};

/** axios/fetch compatible interface for data passed as request config */
export interface IRequestRawConfig<TIn> {
    method: EndpointMethods;
    url: string;
    data: TIn | null | undefined;
    headers: AnyObject;
};

export interface IRequestMeta<T extends IEndpointInfo, TExtra extends object> {
    readonly api: T;
    readonly pathsConfig: EndpointsPathsConfig;
    readonly log: LogTypes;
    readonly noLoader: boolean;
    readonly extra: TExtra;
}

/** Compiled request config object passed to `request` implementation */
export interface IRequestConfig<
    T extends IEndpointInfo = IEndpointInfo,
    TIn = IEndpointInfo.ExtractIn<T>,
    TExtra extends object = Record<string, any>
> extends IRequestRawConfig<TIn> {

    /**
     * Extends raw config with additional details.
     * */
    readonly _meta: IRequestMeta<T, TExtra>;
};

export type CallerResponse<TOut> = {
    data: TOut;
};


export type CallerOptions<TExtra extends object = Record<string, any>> = {
    /** Request implementation */
    request: <TIn, TOut>(config: IRequestConfig<IEndpointInfo, TIn, TExtra>) => Promise<CallerResponse<TOut>>;

    /** Endpoints paths config */
    config?: IEndpointsPathsConfig;

    /** Optional hooks for pre- or post-processing request */
    hooks?: CallerHooks<TExtra> | CallerHooks<TExtra>[];
};

type CombineInputs<T extends IEndpointInfo> =
    & IEndpointInfo.ExtractIn<T, object>
    & IEndpointInfo.ExtractPath<T, object>
    & IEndpointInfo.ExtractQuery<T, object>;

export type EndpointCallArgs<T extends IEndpointInfo> = object extends CombineInputs<T>
    ? (null | undefined | object)
    : CombineInputs<T>;

type CallerParams<T extends IEndpointInfo, TExtra extends object> = object extends CombineInputs<T>
    ? [data?: EndpointCallArgs<T>, extra?: RequestExtra<T> & TExtra]
    : [data: EndpointCallArgs<T>, extra?: RequestExtra<T> & TExtra];

export interface GenericApiCaller<TExtra extends object = Record<string, any>> {
    <T extends IEndpointInfo>(api: T, ...[data, extra]: CallerParams<T, TExtra>): Promise<IEndpointInfo.ExtractOut<T>>;

    readonly config: EndpointsPathsConfig;
}

export interface ApiCaller<TEndpoint extends IEndpointInfo, TExtra extends object = Record<string, any>> {
    (...[data, extra]: CallerParams<TEndpoint, TExtra>): Promise<IEndpointInfo.ExtractOut<TEndpoint>>

    readonly config: EndpointsPathsConfig;
};
