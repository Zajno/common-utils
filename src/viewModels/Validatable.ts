import { observable, makeObservable } from 'mobx';
import { ValidatorFunction, ValidatorFunctionAsync, ValidationErrors, ValidationError } from '../validation';
import { someAsync } from '../async/arrays';

export type ValueValidator = ValidatorFunction | ValidatorFunctionAsync;
export type ValidationErrorsStrings = { [code: number]: string };

export type ValidationConfig = { validator: ValueValidator, errors: ValidationErrorsStrings };

export abstract class ValidatableViewModel {

    private _validator: ValueValidator = null;
    private _strings: ValidationErrorsStrings = null;

    @observable
    private _error: string = null;

    private _validationError: ValidationError = null;

    constructor(config?: ValidationConfig) {
        makeObservable(this);
        this._validator = (config && config.validator) || (() => ValidationErrors.None);
        this._strings = config && config.errors;
    }

    protected abstract get valueToValidate(): string;

    get isValid() { return !this._error; }

    get error() { return this._error; }

    async validate() {
        if (!this._validator) {
            return true;
        }

        try {
            const valid = await this._validator(this.valueToValidate.trim());
            this._validationError = valid === ValidationErrors.None
                ? null
                : new ValidationError('Unknown error', valid);
        } catch (err) {
            this._validationError = err as ValidationError;
        }

        if (!this._validationError) {
            this._error = null;
        } else {
            const code = this._validationError.code;
            this._error = this._strings && this._strings[code];
        }
        return this._validationError == null;
    }

    reset() {
        this._validationError = null;
        this._error = null;
    }

    static async IsSomeInvalid(validatables: ValidatableViewModel[], stopOnFail = true) {
        if (stopOnFail) {
            return someAsync(validatables, async v => !(await v.validate()));
        }

        const results = await Promise.all(validatables.map(v => v.validate()));
        return results.some(r => !r);
    }
}
