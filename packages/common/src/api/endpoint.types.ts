import type { Path } from '../structures/path/index.js';
import { RemoveFunctionFields } from '../types/functions.js';
import type { AnyObject, Coalesce, EmptyObjectNullable, Expand } from '../types/misc.js';
import type { EndpointMethods } from './methods.js';

/**
 * Definition of an abstract REST API endpoint.
 */
export interface IEndpointInfo extends IEndpointInfo.Base,
    IEndpointInfo.IPathAbstract,
    IEndpointInfo.IErrors<any>,
    IEndpointInfo.IQuery<AnyObject> { }

export namespace IEndpointInfo {

    export type Base = {
        /** HTTP method of the endpoint, defaults to `GET`. See {@link EndpointMethods}  */
        readonly method: EndpointMethods;
        /** Optional display name, for logging purposes. */
        readonly displayName?: string;
    };

    export interface IIn<TIn extends object | null> {
        /** Marker for defining input type. */
        readonly in?: TIn;
    }

    export interface IOut<TOut> {
        /** Marker for defining output type. */
        readonly out?: TOut;
    }

    /**
     * Helper interface for defining abstract path builder.
     *
     * `IPath<TPath>` should be assignable to `IPathAbstract`
     */
    export interface IPathAbstract {
        /** Path builder with unknown args */
        readonly path?: Path.IBuilder;
    }

    export interface IPath<TPath extends Path.IBuilder> {
        /**
         * Endpoint path, which can be static (just a string) or parametrized.
         *
         * See {@link Path}
         */
        readonly path: TPath;
    }

    export type QueryKeysType = boolean | string | string[] | number | number[];
    export type QueryArgs = Record<string, QueryKeysType>;

    export interface IQuery<TQuery extends object> {
        /** actual query keys to be used in argument object parsing */
        readonly queryKeys?: (string & keyof TQuery)[];
        /** Marker type for defining query shape. */
        readonly queryTemplate?: TQuery;
    }

    export interface IErrors<TErrors> {
        readonly errorProcessor?: (err: TErrors) => void;
    }

    export interface IHeaders<THeaders> {
        /** Marker type for defining endpoint extra headers. */
        readonly headers?: THeaders;
    }

    // HELPERS & EXTRACTORS

    type Any = AnyObject;
    type Empty = EmptyObjectNullable;

    export type ExtractIn<T, F = Empty> = T extends IIn<infer TIn>
        ? Coalesce<TIn, F>
        : F;

    export type ExtractPath<T, F = Empty> = T extends IPath<infer TPath extends Path.IBuilder>
        ? Path.ExtractObjectArgs<TPath, F>
        : F;

    export type ExtractQuery<T, F = Empty> = T extends IQuery<infer TQuery extends QueryArgs>
        ? TQuery
        : F;

    export type ExtractOut<T> = T extends IOut<infer TOut>
        ? TOut
        : never;

    export type ExtractErrors<T> = T extends IErrors<infer TErrors> ? TErrors : Any;
    export type ExtractHeaders<T> = T extends IHeaders<infer THeaders> ? THeaders : Any;

    type MergeOmit<T, K> = Omit<T, keyof K> & K;

    export type Finalized<T extends Base> = Expand<
        Readonly<
            RemoveFunctionFields<
                & MergeOmit<T, IIn<ExtractIn<T, object | null>>>
                & MergeOmit<T, IOut<ExtractOut<T>>>
                & MergeOmit<T, IPath<T extends IPath<infer TPath> ? TPath : Path.IBuilder>>
                & MergeOmit<T, IQuery<ExtractQuery<T, object>>>
                & MergeOmit<T, IErrors<ExtractErrors<T>>>
                & MergeOmit<T, IHeaders<ExtractHeaders<T>>>
            >
        >
    >;
}
