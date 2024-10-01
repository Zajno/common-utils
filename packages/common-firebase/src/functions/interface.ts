import type { RuntimeOptions } from 'firebase-functions/v1';

export type Converter<T1, T2> = (a: T1) => T2;
export type Processor<T1, T2> = (a: T1) => T2 | Promise<T2>;

type FunctionResult<T> = Promise<{ data: T }>;
export type FunctionType<TArg, TResult> = (data: TArg) => FunctionResult<TResult>;

export type EndpointSettings = Pick<RuntimeOptions, 'memory' | 'timeoutSeconds' | 'minInstances' | 'failurePolicy'>;

export interface IFunctionDefinitionInfo {
    readonly Name: string;
    readonly Namespace: string;
    readonly CallableName: string;
    readonly Options?: EndpointSettings;
}

export interface IFunctionDefinition<TArg, TResult> extends IFunctionDefinitionInfo {
    readonly Function: FunctionType<TArg, TResult>;

    readonly ArgProcessor: Processor<TArg, any>;
    readonly ResultProcessor: Processor<any, TResult>;
}
