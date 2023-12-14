import { someAsync } from '../async/arrays';
import { AnyObject } from '../types';
import { ValidationErrors } from './ValidationErrors';
import {
    ValidationConfig,
    ValidationError,
    ValidationResults,
    ValidationVoid,
    ValidatorFunction,
    ValidatorFunctionAsync,
} from './types';

export function createShouldBeEqualTo<T = string>(getter: () => T): ValidatorFunction<T> {
    return (val: T) => getter() === val ? ValidationErrors.None : ValidationErrors.ShouldBeEqualTo;
}

export function throwNotOk(result: ValidationErrors, message = 'Validation error') {
    if (result) {
        throw new ValidationError(message, result);
    }
}

export function validateObject<T extends AnyObject, TErrors = ValidationErrors>(
    obj: T,
    validators: ValidationConfig<T, TErrors>,
    onlyTruthy = false,
    context?: T,
): ValidationResults<T, TErrors> {

    const res: ValidationResults<T, TErrors> = { };

    Object.keys(obj).forEach(k => {
        const kk = k as keyof T;
        const validator: undefined | ValidatorFunction<T[typeof kk], TErrors, T> = validators[kk];
        if (!validator) {
            return;
        }

        const v = obj[k as keyof T];
        if (onlyTruthy && !v) {
            return;
        }

        const err = validator(v, context || obj);
        if (err) {
            res[kk] = err;
        }
    });

    return res;
}

export function combineValidators<T = string, TErrors = ValidationErrors, TContext = any>(...validators: ValidatorFunction<T, TErrors, TContext>[]) {
    return (val: T, ctx?: TContext) => {
        for (const validator of validators) {
            const err = validator(val, ctx);
            if (err) {
                return err;
            }
        }

        return ValidationErrors.None;
    };
}

export async function combineValidatorsAsync<T = string, TErrors = ValidationErrors, TContext = any>(...validators: ValidatorFunctionAsync<T, TErrors, TContext>[]) {
    return async (val: T, ctx?: TContext) => {
        for (const validator of validators) {
            const err = await validator(val, ctx);
            if (err) {
                return err;
            }
        }

        return ValidationErrors.None;
    };
}

export async function IsSomeInvalid(validatables: ReadonlyArray<ValidationVoid>, stopOnFail = true) {
    if (stopOnFail) {
        return someAsync(validatables, async v => !(await v.validate()));
    }

    const results = await Promise.all(validatables.map(v => v.validate()));
    return results.some(r => !r);
}

export async function getFirstValidationError(...validatables: ValidationVoid[]) {
    for (const v of validatables) {
        if (!(await v.validate())) {
            return v.error;
        }
    }
    return null;
}
