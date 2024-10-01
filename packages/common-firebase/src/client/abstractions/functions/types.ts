import type { IFunctionDefinition, IFunctionDefinitionInfo } from '../../../functions/interface';

export type { IFunctionDefinition, IFunctionDefinitionInfo };

export interface IFunctionWorker<TArg, TResult> {
    execute(arg: TArg): Promise<TResult>;
}

export interface IFirebaseFunctions {
    create<TArg, TResult>(definition: IFunctionDefinition<TArg, TResult>): IFunctionWorker<TArg, TResult>;
}

export interface IFunctionsError {
    code: string;
    message: string;
    details: string;
}
