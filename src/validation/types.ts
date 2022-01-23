import { ValidationErrors } from './ValidationErrors';

export type ValidatorFunction<T = string, TErrors = ValidationErrors> = (val: T) => TErrors;
export type ValidatorFunctionAsync<T = string, TErrors = ValidationErrors> = (val: T) => Promise<TErrors>;

export type WrapperFunction = (val: ValidatorFunction) => ValidatorFunction;

export class ValidationError<TErrors = ValidationErrors> extends Error {
    readonly code: TErrors = null;

    constructor(message: string, code: TErrors) {
        super(message);
        this.code = code;
    }
}
