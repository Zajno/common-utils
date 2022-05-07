import { ValidationErrors } from './ValidationErrors';
import {
    ValidationConfig,
    ValidationError,
    ValidationResults,
    ValidatorFunction,
} from './types';

export function createShouldBeEqualTo<T = string>(getter: () => T): ValidatorFunction<T> {
    return (val: T) => getter() === val ? ValidationErrors.None : ValidationErrors.ShouldBeEqualTo;
}

export function throwNotOk(result: ValidationErrors, message = 'Validation error') {
    if (result) {
        throw new ValidationError(message, result);
    }
}

export function validateObject<T, TErrors = ValidationErrors>(
    obj: T,
    validators: ValidationConfig<T, TErrors>,
    onlyTruethy = false,
): ValidationResults<T, TErrors> {

    const res: ValidationResults<T, TErrors> = { };

    Object.keys(obj).forEach(k => {
        const kk = k as keyof T;
        const validator: ValidatorFunction<T[typeof kk], TErrors, T> = validators[kk];
        if (!validator) {
            return;
        }

        const v = obj[k as keyof T];
        if (onlyTruethy && !v) {
            return;
        }

        const err = validator(v, obj);
        if (err) {
            res[kk] = err;
        }
    });

    return res;
}
