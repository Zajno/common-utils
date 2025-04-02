import { Path } from '../structures/path/index.js';
import { EndpointMethods } from './methods.js';
import type { Mutable } from '../types/misc.js';
import type { IEndpointInfo } from './endpoint.types.js';

/** @import { buildApiCaller } from "./call" */

/** Not an ideal way to merge type because overlapping fields will be incorrectly overridden.
 *
 * Extractor types works okay unless there're no overlapping fields when extending endpoint type.
 *
 * That's a trade-off, because in case of `Omit` usage extractor type are still okay but chaining like with `asForm()` is broken. */
type Merge<T, K> = K & T;

export type { IEndpointInfo };

/**
 * Defines REST API endpoint.
 *
 * Endpoint object can be used in a caller method (see {@link buildApiCaller}) to make a request.
 *
 * Basic definition {@link IEndpointInfo} which can be extended with additional properties and chaining mutation methods, see {@link IEndpointInfo.IForm} for example.
*/
export interface ApiEndpoint extends IEndpointInfo {
    /** Applies specified HTTP method */
    withMethod(method: EndpointMethods): this;
    /** Applies GET HTTP method and specifies output type */
    get<TOut>(): Merge<this, IEndpointInfo.IOut<TOut>>;
    /** Applies PUT HTTP method and specifies input and output types */
    put<TIn extends object | null, TOut>(): Merge<this, IEndpointInfo.IIn<TIn> & IEndpointInfo.IOut<TOut>>;
    /** Applies POST HTTP method and specifies input and output types */
    post<TIn extends object | null, TOut>(): Merge<this, IEndpointInfo.IIn<TIn> & IEndpointInfo.IOut<TOut>>;
    /** Applies DELETE HTTP method and specifies output type */
    delete<TOut>(): Merge<this, IEndpointInfo.IOut<TOut>>;

    /** Applies a type based on {@link Path.IBuilder} type by accepting arguments for {@link Path.construct} function */
    withPath<P extends Path.BaseInput[]>(...path: P): Merge<this, IEndpointInfo.IPath<Path.ExtractArgs<Path.CombineBuilders<P>>>>;

    /** Applies query type and also store query keys to make api caller be able to distinguish which keys should be ejected from request body. */
    withQuery<TQ extends object>(...queryKeys: (string & keyof TQ)[]): Merge<this, IEndpointInfo.IQuery<TQ>>;

    /** Applies error type, optionally stores error processor. */
    withErrors<TErr>(errorProcessor?: (err: TErr) => void): Merge<this, IEndpointInfo.IErrors<TErr>>;

    /** Applies headers type. */
    withHeaders<THeads>(_headersMarker?: THeads): Merge<this, IEndpointInfo.IHeaders<THeads>>;
}

export namespace ApiEndpoint {

    /** Since we don't use class anymore, we need another way to determine an object to be an Endpoint instance. */
    const ENDPOINT_OBJ_MARKER = '_ENDPOINT_OBJ_MARKER';

    export function isEndpoint(obj: any): obj is ApiEndpoint {
        return obj[ENDPOINT_OBJ_MARKER] === true;
    }

    function createBase(displayName?: string): ApiEndpoint {

        const data = {
            path: Path.Empty,
            displayName,
            method: EndpointMethods.GET,
        };

        (data as any)[ENDPOINT_OBJ_MARKER] = true;

        const res = data as ApiEndpoint;

        // only extension methods
        const ext: Omit<ApiEndpoint, keyof IEndpointInfo> = {
            withMethod(method: EndpointMethods) {
                data.method = method;
                return res;
            },
            get<TOut>() {
                data.method = EndpointMethods.GET;
                return res as ApiEndpoint & IEndpointInfo.IOut<TOut>;
            },
            put<TIn extends object | null, TOut>() {
                data.method = EndpointMethods.PUT;
                return res as ApiEndpoint & IEndpointInfo.IIn<TIn> & IEndpointInfo.IOut<TOut>;
            },
            post<TIn extends object | null, TOut>() {
                data.method = EndpointMethods.POST;
                return res as ApiEndpoint & IEndpointInfo.IIn<TIn> & IEndpointInfo.IOut<TOut>;
            },
            delete<TOut>() {
                data.method = EndpointMethods.DELETE;
                return res as ApiEndpoint & IEndpointInfo.IOut<TOut>;
            },

            withPath<P extends Path.BaseInput[]>(...path: P) {
                const p = Path.construct(...path);
                data.path = p;
                return res as ApiEndpoint & IEndpointInfo.IPath<Path.ExtractArgs<Path.CombineBuilders<P>>>;
            },

            withQuery<TQ extends object>(...queryKeys: (string & keyof TQ)[]) {
                (data as Mutable<IEndpointInfo.IQuery<TQ>>).queryKeys = queryKeys;
                return res as ApiEndpoint & IEndpointInfo.IQuery<TQ>;
            },

            withErrors<TErr>(errorProcessor?: (err: TErr) => void) {
                (data as Mutable<IEndpointInfo.IErrors<TErr>>).errorProcessor = errorProcessor;
                return res;
            },

            withHeaders() {
                return res;
            },
        };

        Object.assign(res, ext);
        return res;
    }

    export interface IBuilder<T extends ApiEndpoint = ApiEndpoint> {
        (displayName?: string): T;

        extend<TExt>(extender: (base: T) => T & TExt): IBuilder<T & TExt>;
    }

    export type IBuilderExtender<T> = <TBase extends ApiEndpoint>(base: TBase) => TBase & T;

    function createBuilder<TBase extends ApiEndpoint, T>(
        base: (displayName?: string) => TBase,
        extender: (base: TBase) => T,
    ): IBuilder<TBase & T>;
    function createBuilder<TBase extends ApiEndpoint>(
        base: (displayName?: string) => TBase,
    ): IBuilder<TBase>;

    function createBuilder<TBase extends ApiEndpoint, T>(
        baseFactory: (displayName?: string) => TBase,
        extender?: (base: TBase) => T,
    ): IBuilder<TBase & T> {
        const res = function (displayName?: string) {
            const baseRes = baseFactory(displayName);
            return extender ? extender(baseRes) : baseRes;
        } as IBuilder<TBase & T>;

        res.extend = (extender) => {
            return createBuilder(
                res,
                extender,
            );
        };

        return res;
    }

    export const create = createBuilder(createBase);
}
