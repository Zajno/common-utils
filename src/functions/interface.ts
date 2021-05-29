
export type Converter<T1, T2> = (a: T1) => T2;
export type Processor<T1, T2> = (a: T1) => T2 | Promise<T2>;
export type FunctionsMemoryOptions = '128MB' | '256MB' | '512MB' | '1GB' | '2GB';

type FunctionResult<T> = Promise<{ data: T }>;
export type FunctionType<TArg, TResult> = (data: TArg) => FunctionResult<TResult>;

export interface IFunctionDefinitionInfo {
    readonly Name: string;
    readonly Namespace: string;
    readonly CallableName: string;
    readonly Timeout: number;
    readonly Memory: FunctionsMemoryOptions;
}

export interface IFunctionDefinition<TArg, TResult> extends IFunctionDefinitionInfo {
    readonly Function: FunctionType<TArg, TResult>;

    readonly ArgProcessor: Processor<TArg, any>;
    readonly ResultProcessor: Processor<any, TResult>;
}
