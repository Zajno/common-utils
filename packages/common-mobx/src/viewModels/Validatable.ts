import { observable, makeObservable, action, runInAction } from 'mobx';
import { ValidatorFunction, ValidatorFunctionAsync, ValidationErrors, ValidationError } from '@zajno/common/validation/index';
import type { ValidationThrower } from '@zajno/common/validation/throwers';

export type ValueValidator<T, TErrors = ValidationErrors> = ValidatorFunction<T, TErrors> | ValidatorFunctionAsync<T, TErrors>;
export type ValidationErrorsStrings<TErrors extends string | number = number> = Partial<Omit<Record<TErrors, string>, 0>>;

export type ValidationConfig<T, TErrors extends string | number = ValidationErrors> = {
    validator: ValueValidator<Readonly<T>, TErrors>,
    errors: ValidationErrorsStrings<TErrors>,
};


const EmptyValidator = () => 0;

export abstract class ValidatableModel<T = string> {

    private _validator: null | ValueValidator<T | Readonly<T> | null, any> = null;
    private _strings: null | ValidationErrorsStrings<any> = null;

    // @observable
    private _error: string | null = null;

    protected _validateOnChange = false;

    constructor() {
        makeObservable<ValidatableModel<T>, '_error'>(this, {
            _error: observable,
            reset: action,
        });
    }

    protected abstract get valueToValidate(): T | Readonly<T> | null;

    get isValid() { return !this._error; }

    get error() { return this._error; }

    public setValidationConfig<TErrors extends string | number = ValidationErrors>(config?: ValidationConfig<T, TErrors> | ValidationThrower<T>) {
        if (config) {
            if (typeof config === 'function') {
                this._validator = config;
            } else {
                this._validator = config.validator || EmptyValidator;
                this._strings = config.errors;
            }
        } else {
            this._validator = EmptyValidator;
            this._strings = null;
        }
        return this;
    }

    public validateOnChange(enable = true) {
        this._validateOnChange = enable;
        return this;
    }

    /** should return true-thy error code if NOT OK; otherwise if OK it will return null or zero code */
    public async validateValue(value: T | null): Promise<ValidationError | string | number | null> {
        if (this._validator) {
            try {
                const res = await this._validator(value);
                return res ?? null;
            } catch (err) {
                if (err instanceof ValidationError) {
                    return err;
                }
                // added yup compatibility
                return err.errors?.[0] || err.message || 'Unspecified error';
            }
        }
        return null;
    }

    async validate() {
        if (!this._validator) {
            return true;
        }

        let errorCode: ValidationErrors | null = null;
        let errorStr: string | null = null;
        const validationResult = await this.validateValue(this.valueToValidate);
        if (validationResult != null) {
            if (validationResult instanceof ValidationError) {
                errorCode = validationResult.code;
                errorStr = validationResult.message;
            } else if (typeof validationResult === 'string') {
                errorStr = validationResult;
            } else {
                errorCode = validationResult;
            }
        }

        runInAction(() => {
            this._error = errorStr || (errorCode && this._strings?.[errorCode]) || null;
        });

        return this._error == null;
    }

    async getIsInvalid() {
        const valid = await this.validate();
        return !valid;
    }

    // @action
    reset() {
        this._error = null;
    }
}
