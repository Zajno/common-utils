import { observable, makeObservable, action } from 'mobx';
import { ValidatorFunction, ValidatorFunctionAsync, ValidationErrors, ValidationError } from '../validation';
import { someAsync } from '../async/arrays';

export type ValueValidator<T> = ValidatorFunction<T> | ValidatorFunctionAsync<T>;
export type ValidationErrorsStrings = { [code: number]: string };

export type ValidationConfig<T> = {
    validator: ValueValidator<Readonly<T>>,
    errors: ValidationErrorsStrings,
};

const EmptyValidator = () => ValidationErrors.None;
export abstract class ValidatableModel<T = string> {

    private _validator: ValueValidator<Readonly<T>> = null;
    private _strings: ValidationErrorsStrings = null;

    @observable
    private _error: string = null;

    private _validationError: ValidationError = null;

    constructor(config?: ValidationConfig<T>) {
        makeObservable(this);
        this.setValidationConfig(config);
    }

    protected abstract get valueToValidate(): Readonly<T>;

    get isValid() { return !this._error; }

    get error() { return this._error; }

    public setValidationConfig(config?: ValidationConfig<T>) {
        this._validator = config?.validator || EmptyValidator;
        this._strings = config?.errors;
        return this;
    }

    async validate() {
        if (!this._validator) {
            return true;
        }

        try {
            const valid = await this._validator(this.valueToValidate);
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

    async getIsInvalid() {
        const valid = await this.validate();
        return !valid;
    }

    @action
    reset() {
        this._validationError = null;
        this._error = null;
    }

    static async IsSomeInvalid(validatables: ReadonlyArray<Readonly<ValidatableModel>>, stopOnFail = true) {
        if (stopOnFail) {
            return someAsync(validatables, async v => !(await v.validate()));
        }

        const results = await Promise.all(validatables.map(v => v.validate()));
        return results.some(r => !r);
    }
}
