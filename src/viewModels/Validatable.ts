import { observable, makeObservable, action, runInAction } from 'mobx';
import { ValidatorFunction, ValidatorFunctionAsync, ValidationErrors, ValidationError } from '@zajno/common/validation';
import { someAsync } from '@zajno/common/async/arrays';

export type ValueValidator<T, TErrors = ValidationErrors> = ValidatorFunction<T, TErrors> | ValidatorFunctionAsync<T, TErrors>;
export type ValidationErrorsStrings<TErrors extends string | number = number> = Partial<Omit<Record<TErrors, string>, 0 | null>>;

export type ValidationConfig<T, TErrors extends string | number = ValidationErrors> = {
    validator: ValueValidator<Readonly<T>, TErrors>,
    errors: ValidationErrorsStrings<TErrors>,
};

const EmptyValidator = () => 0;

export abstract class ValidatableModel<T = string> {

    private _validator: ValueValidator<T | Readonly<T>, any> = null;
    private _strings: ValidationErrorsStrings<any> = null;

    // @observable
    private _error: string = null;

    private _validationError: ValidationError = null;
    protected _validateOnChange = false;

    constructor() {
        makeObservable<ValidatableModel<T>, '_error'>(this, {
            _error: observable,
            reset: action,
        });
    }

    protected abstract get valueToValidate(): T | Readonly<T>;

    get isValid() { return !this._error; }

    get error() { return this._error; }

    public setValidationConfig<TErrors extends string | number = ValidationErrors>(config?: ValidationConfig<T, TErrors>) {
        this._validator = config?.validator || EmptyValidator;
        this._strings = config?.errors;
        return this;
    }

    public validateOnChange(enable = true) {
        this._validateOnChange = enable;
        return this;
    }

    public async testValidate(value: T) {
        if (this._validator) {
            const res = await this._validator(value);
            return res;
        }
        return null;
    }

    async validate() {
        if (!this._validator) {
            return true;
        }

        try {
            const validationResult = await this._validator(this.valueToValidate);
            this._validationError = !validationResult
                ? null
                : new ValidationError('Unknown error', validationResult);
        } catch (err) {
            this._validationError = err as ValidationError;
        }

        runInAction(() => {
            if (!this._validationError) {
                this._error = null;
            } else {
                const code = this._validationError.code;
                this._error = this._strings && this._strings[code];
            }
        });
        return this._validationError == null;
    }

    async getIsInvalid() {
        const valid = await this.validate();
        return !valid;
    }

    // @action
    reset() {
        this._validationError = null;
        this._error = null;
    }

    static async IsSomeInvalid(validatables: ReadonlyArray<ValidatableModel<any>>, stopOnFail = true) {
        if (stopOnFail) {
            return someAsync(validatables, async v => !(await v.validate()));
        }

        const results = await Promise.all(validatables.map(v => v.validate()));
        return results.some(r => !r);
    }
}
