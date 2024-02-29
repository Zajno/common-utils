import { AnyObject, EmptyObject } from '../types';
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
    TIn extends object | null,
    TOut,
    TPath extends readonly string[],
    TQuery extends object,
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

    public withPath<P extends Path.BaseInput>(path: P): ApiEndpoint<TIn, TOut, Path.ExtractArgs<P>, TQuery, TErrors, THeaders> {
        type Args = Path.ExtractArgs<P>;
        const res = this as unknown as ApiEndpoint<TIn, TOut, Args, TQuery, TErrors, THeaders>;
        type PathType = Path.SwitchBuilder<Args>;
        const p = Path.construct(path);
        res.path = p as unknown as PathType;
        return res;
    }

    public withQuery<TQ extends object>(...queryKeys: (string & keyof TQ)[]): ApiEndpoint<TIn, TOut, TPath, TQ, TErrors, THeaders> {
        const res = this as unknown as ApiEndpoint<TIn, TOut, TPath, TQ, TErrors, THeaders>;
        res.queryKeys = queryKeys;
        return res;
    }

    public withErrors<TErr>(_errors?: TErr): ApiEndpoint<TIn, TOut, TPath, TQuery, TErr, THeaders> {
        return this as unknown as ApiEndpoint<TIn, TOut, TPath, TQuery, TErr, THeaders>;
    }

    public withHeaders<THeads>(_headersMarker?: THeads): ApiEndpoint<TIn, TOut, TPath, TQuery, TErrors, THeads> {
        return this as unknown as ApiEndpoint<TIn, TOut, TPath, TQuery, TErrors, THeads>;
    }

    public asForm() {
        this.isForm = true;
        return this;
    }
}

export namespace ApiEndpoint {

    type Any = AnyObject;
    type Empty = (EmptyObject | null | undefined);
    type Coalesce<T> = [T] extends [never] | [null] | [undefined]
        ? Empty
        : T
    ;

    export type ExtractIn<T> = T extends ApiEndpoint<infer TIn, any, any, any, any, any>
        ? Coalesce<TIn>
        : Empty;

    export type ExtractPath<T> = T extends ApiEndpoint<any, any, infer TPath extends string[], any, any, any>
        ? (readonly [] extends TPath ? Empty : Path.ObjectBuilderArgs<TPath[number]>)
        : Empty;

    export type ExtractQuery<T> = T extends ApiEndpoint<any, any, any, infer TQuery, any, any>
        ? TQuery
        : Empty;

    export type ExtractOut<T> = T extends ApiEndpoint<any, infer TOut, any, any, any, any>
        ? TOut
        : Empty;

    export type ExtractErrors<T> = T extends ApiEndpoint<any, any, any, any, infer TErrors, any> ? TErrors : Any;
    export type ExtractHeaders<T> = T extends ApiEndpoint<any, any, any, any, any, infer THeaders> ? THeaders : Any;
}
