import { Path } from '../structures/path';
import { AnyObject, Coalesce, EmptyObjectNullable } from '../types/misc';
import { EndpointMethods } from './methods';

export interface IEndpointInfo {
    readonly method: EndpointMethods;
    readonly isForm?: boolean;

    readonly pathBuilder: Path.IBuilder;

    readonly displayName?: string;
    readonly errorProcessor?: (err?: any) => void;

    readonly queryKeys?: string[];
}

export namespace IEndpointInfo {

    export interface IIn<TIn extends object | null> {
        readonly in?: TIn;
    }

    export class IOut<TOut> {
        readonly out?: TOut;
    }

    export interface IPath<TPath extends readonly string[]> {
        readonly path: Path.SwitchBuilder<TPath>;
    }

    export interface IQuery<TQuery extends object> {
        readonly queryKeys?: (string & keyof TQuery)[];
    }

    export interface IErrors<TErrors> {
        readonly errorProcessor?: (err: TErrors) => void;
    }

    export interface IHeaders<THeaders> {
        readonly headers?: THeaders;
    }

    type Any = AnyObject;
    type Empty = EmptyObjectNullable;

    export type ExtractIn<T> = T extends IIn<infer TIn>
        ? Coalesce<TIn>
        : Empty;

    export type ExtractPath<T> = T extends IPath<infer TPath extends string[]>
        ? (readonly [] extends TPath ? Empty : Path.ObjectBuilderArgs<TPath[number]>)
        : Empty;

    export type ExtractQuery<T> = T extends IQuery<infer TQuery>
        ? TQuery
        : Empty;

    export type ExtractOut<T> = T extends IOut<infer TOut>
        ? TOut
        : never;

    export type ExtractErrors<T> = T extends IErrors<infer TErrors> ? TErrors : Any;
    export type ExtractHeaders<T> = T extends IHeaders<infer THeaders> ? THeaders : Any;
}
