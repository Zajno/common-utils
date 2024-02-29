import { AnyObject } from '../types';
import { Path } from '../structures/path';
import { EndpointMethods } from './methods';

export interface IEndpointInfo {
    readonly method: EndpointMethods;
    readonly isForm?: boolean;

    readonly pathBuilder: Path.IBuilder;

    readonly displayName?: string;

    readonly queryKeys?: string[];
}

export class ApiEndpoint<
    TIn extends AnyObject | null,
    TOut,
    TPath extends string[],
    TQuery extends AnyObject,
    TErrors,
    THeaders,
> implements IEndpointInfo {

    method: EndpointMethods = EndpointMethods.GET;
    path: Path.SwitchBuilder<TPath> = Path.Empty.as<Path.SwitchBuilder<TPath>>();

    isForm?: boolean;
    queryKeys?: (string & keyof TQuery)[];
    headers?: THeaders;

    displayName?: string;

    in?: TIn;
    out?: TOut;
    errors?: TErrors;

    public get pathBuilder() { return this.path.as<Path.IBuilder>(); }

    static construct<TIn extends AnyObject | null, TOut>(method: EndpointMethods = EndpointMethods.GET, displayName?: string) {
        const res = new ApiEndpoint<TIn, TOut, string[], AnyObject, any, AnyObject>();
        res.method = method;
        res.displayName = displayName;
        return res;
    }

    static get<TOut>(displayName?: string) {
        return ApiEndpoint.construct<null, TOut>(EndpointMethods.GET, displayName);
    }

    static post<TIn extends AnyObject | null, TOut = void>(displayName?: string) {
        return ApiEndpoint.construct<TIn, TOut>(EndpointMethods.POST, displayName);
    }

    static delete<TOut>(displayName?: string) {
        return ApiEndpoint.construct<null, TOut>(EndpointMethods.DELETE, displayName);
    }

    public withPath<P extends Path.BaseInput>(path: P): ApiEndpoint<TIn, TOut, Path.ExtractArgs<P>, TQuery, TErrors, THeaders> {
        type Args = Path.ExtractArgs<P>;
        const res = this as unknown as ApiEndpoint<TIn, TOut, Args, TQuery, TErrors, THeaders>;
        res.path = Path.construct(path) as Path.SwitchBuilder<Args>;
        return res;
    }

    public withQuery<TQ extends AnyObject>(...queryKeys: (string & keyof TQ)[]): ApiEndpoint<TIn, TOut, TPath, TQ, TErrors, THeaders> {
        const res = this as unknown as ApiEndpoint<TIn, TOut, TPath, TQ, TErrors, THeaders>;
        res.queryKeys = queryKeys;
        return res;
    }

    public withErrors<TErr>(_errors?: TErr): ApiEndpoint<TIn, TOut, TPath, TQuery, TErr, THeaders> {
        return this as unknown as ApiEndpoint<TIn, TOut, TPath, TQuery, TErr, THeaders>;
    }

    public withHeaders<THeads>(_headers?: THeads): ApiEndpoint<TIn, TOut, TPath, TQuery, TErrors, THeads> {
        return this as unknown as ApiEndpoint<TIn, TOut, TPath, TQuery, TErrors, THeads>;
    }

    public asForm() {
        this.isForm = true;
        return this;
    }
}

export namespace ApiEndpoint {

    type Empty = AnyObject;

    export type ExtractIn<T> = T extends ApiEndpoint<infer TIn, any, any, any, any, any> ? TIn : Empty;
    export type ExtractOut<T> = T extends ApiEndpoint<any, infer TOut, any, any, any, any> ? TOut : Empty;
    export type ExtractInPath<T> = T extends ApiEndpoint<any, any, infer TPath extends string[], any, any, any> ? Path.BuilderArgs<TPath[number]> : Empty;
    export type ExtractQuery<T> = T extends ApiEndpoint<any, any, any, infer TQuery, any, any> ? TQuery : Empty;
    export type ExtractErrors<T> = T extends ApiEndpoint<any, any, any, any, infer TErrors, any> ? TErrors : Empty;
    export type ExtractHeaders<T> = T extends ApiEndpoint<any, any, any, any, any, infer THeaders> ? THeaders : Empty;
}
