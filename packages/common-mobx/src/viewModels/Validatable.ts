import {
    observable,
    makeObservable,
    action,
    runInAction,
} from 'mobx';
import {
    type ValidatorFunction,
    type ValidatorFunctionAsync,
    ValidationErrors,
    ValidationError,
    type ValidationVoid,
} from '@zajno/common/validation';
import type { ValidationThrower } from '@zajno/common/validation/throwers';
import type { Nullable } from '@zajno/common/types/misc';
import type { IValueModel } from '@zajno/common/models/types';
import { extendObjectWithFocusable } from './extensions.js';

export type ValueValidator<T, TErrors = ValidationErrors> = ValidatorFunction<T, TErrors> | ValidatorFunctionAsync<T, TErrors>;
export type ValidationErrorsStrings<TErrors extends string | number = number> = Partial<Omit<Record<TErrors, string>, 0>>;

export type ValidationConfig<T, TErrors extends string | number = ValidationErrors> = {
    validator: ValueValidator<Readonly<T>, TErrors>,
    errors: ValidationErrorsStrings<TErrors>,
};


const EmptyValidator = () => 0;

export abstract class ValidatableModel<T = string> implements ValidationVoid {

    private _validator: Nullable<ValueValidator<T | Readonly<T>, any>> = null;
    private _strings: Nullable<ValidationErrorsStrings<any>> = null;

    private _error: Nullable<string> = null;

    protected _validateOnChange = false;

    constructor() {
        makeObservable<ValidatableModel<T>, '_error'>(this, {
            _error: observable,
            resetError: action,
        });
    }

    protected abstract get valueToValidate(): T | Readonly<T> | null;

    get isValid() { return !this._error; }

    get error() { return this._error; }

    public setValidationConfig<TErrors extends string | number = ValidationErrors>(config?: ValidationConfig<T, TErrors> | ValidationThrower<T | Readonly<T>>) {
        if (config) {
            if (typeof config === 'function') {
                this._validator = config;
            } else {
                this._validator = config.validator || EmptyValidator;
                this._strings = config.errors;
            }
        } else {
            this._validator = null;
            this._strings = null;
            this._error = null;
        }
        return this;
    }

    public validateOnChange(enable = true) {
        this._validateOnChange = enable;
        return this;
    }

    protected validateOnChangeIfNeeded() {
        if (this._validateOnChange) {
            this.validate();
        }
    }

    /** should return true-thy error code if NOT OK; otherwise if OK it will return null or zero code */
    public async validateValue(value: T | null): Promise<ValidationError | string | number | null> {
        if (this._validator) {
            try {
                const res = await this._validator(value!);
                return res ?? null;
            } catch (err) {
                if (err instanceof ValidationError) {
                    return err;
                }
                // added yup compatibility
                return (err as { errors: string[] }).errors?.[0]
                    || (err as { message: string }).message
                    || 'Unspecified error';
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
    resetError(error: Nullable<string> = null) {
        this._error = error;
    }

    reset() {
        this.resetError();
    }

    public static extendWithFocus<T extends ValidatableModel<any>>(model: T) {
        return extendObjectWithFocusable(model, v => {
            if (!v) {
                model.validate();
            } else {
                ValidatableModel.prototype.reset.call(model);
            }
        });
    }
}

export class GenericValidatable<T> extends ValidatableModel<T> implements IValueModel<T> {

    constructor(private readonly model: IValueModel<T>) {
        super();
    }

    get value() { return this.model.value; }
    set value(v: T) { this.setValue(v); }

    protected get valueToValidate() { return this.model.value; }

    setValue(value: T) {
        this.model.value = value;
        this.validateOnChangeIfNeeded();
    }

    extendWithFocus() {
        return ValidatableModel.extendWithFocus(this);
    }
}
