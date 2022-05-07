import { ValidationErrors } from './ValidationErrors';

export type ValidatorFunction<T = string, TErrors = ValidationErrors, TContext = any> = (val: T, ctx?: TContext) => TErrors;
export type ValidatorFunctionAsync<T = string, TErrors = ValidationErrors, TContext = any> = (val: T, ctx?: TContext) => Promise<TErrors>;

export type ValidationConfig<T, TErrors> = { [P in keyof T]?: ValidatorFunction<T[P], TErrors, T> };
export type ValidationResults<T, TErrors> = { [P in keyof T]?: TErrors };

export type WrapperFunction = (val: ValidatorFunction) => ValidatorFunction;

export class ValidationError<TErrors = ValidationErrors> extends Error {
    readonly code: TErrors = null;

    constructor(message: string, code: TErrors) {
        super(message);
        this.code = code;
    }
}
