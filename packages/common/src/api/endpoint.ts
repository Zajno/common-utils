import { AnyObject } from '../types';
import { Path } from '../structures/path';
import { EndpointMethods } from './methods';
import { IEndpointInfo } from './endpoint.types';

export type { IEndpointInfo };

export class ApiEndpoint<
    TIn extends object | null,
    TOut,
    TPath extends readonly string[],
    TQuery extends object,
    TErrors,
    THeaders,
> implements
IEndpointInfo,
IEndpointInfo.IIn<TIn>,
IEndpointInfo.IOut<TOut>,
IEndpointInfo.IPath<TPath>,
IEndpointInfo.IQuery<TQuery>,
IEndpointInfo.IErrors<TErrors>,
IEndpointInfo.IHeaders<THeaders> {

    method: EndpointMethods = EndpointMethods.GET;
    path: Path.SwitchBuilder<TPath> = Path.Empty.as<Path.SwitchBuilder<TPath>>();

    isForm?: boolean;
    displayName?: string;

    in?: TIn;
    out?: TOut;
    queryKeys?: (string & keyof TQuery)[];

    errorProcessor?: (err: TErrors) => void;
    headers?: THeaders;

    public get pathBuilder() { return this.path.as<Path.IBuilder>(); }

    static construct<TIn extends object | null, TOut>(method: EndpointMethods = EndpointMethods.GET, displayName?: string) {
        const res = new ApiEndpoint<TIn, TOut, readonly [], object, any, AnyObject>();
        res.method = method;
        res.displayName = displayName;
        return res;
    }

    static get<TOut>(displayName?: string) {
        return ApiEndpoint.construct<null, TOut>(EndpointMethods.GET, displayName);
    }

    static post<TIn extends object | null, TOut = void>(displayName?: string) {
        return ApiEndpoint.construct<TIn, TOut>(EndpointMethods.POST, displayName);
    }

    static delete<TOut>(displayName?: string) {
        return ApiEndpoint.construct<null, TOut>(EndpointMethods.DELETE, displayName);
    }

    public withPath<P extends Path.BaseInput[]>(...path: P): ApiEndpoint<TIn, TOut, Path.ExtractArgs<Path.CombineBuilders<P>>, TQuery, TErrors, THeaders> {
        type PathType = Path.CombineBuilders<P>;
        type Args = Path.ExtractArgs<PathType>;
        const res = this as unknown as ApiEndpoint<TIn, TOut, Args, TQuery, TErrors, THeaders>;
        const p = Path.construct(...path);
        res.path = p as unknown as Path.SwitchBuilder<Args>;
        return res;
    }

    public withQuery<TQ extends object>(...queryKeys: (string & keyof TQ)[]): ApiEndpoint<TIn, TOut, TPath, TQ, TErrors, THeaders> {
        const res = this as unknown as ApiEndpoint<TIn, TOut, TPath, TQ, TErrors, THeaders>;
        res.queryKeys = queryKeys;
        return res;
    }

    public withErrors<TErr>(errorProcessor?: (err: TErr) => void): ApiEndpoint<TIn, TOut, TPath, TQuery, TErr, THeaders> {
        const res = this as unknown as ApiEndpoint<TIn, TOut, TPath, TQuery, TErr, THeaders>;
        res.errorProcessor = errorProcessor;
        return res;
    }

    public withHeaders<THeads>(_headersMarker?: THeads): ApiEndpoint<TIn, TOut, TPath, TQuery, TErrors, THeads> {
        return this as unknown as ApiEndpoint<TIn, TOut, TPath, TQuery, TErrors, THeads>;
    }

    public asForm() {
        this.isForm = true;
        return this;
    }
}
