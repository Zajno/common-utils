import { ValidationError, ValidatorFunction } from './types';
import { ValidationErrors } from './ValidationErrors';

export function createShouldBeEqualTo<T = string>(getter: () => T): ValidatorFunction<T> {
    return (val: T) => getter() === val ? ValidationErrors.None : ValidationErrors.ShouldBeEqualTo;
}

export function throwNotOk(result: ValidationErrors, message = 'Validation error') {
    if (result) {
        throw new ValidationError(message, result);
    }
}

export function validateObject<T>(
    obj: T,
    validators: { [P in keyof T]?: ValidatorFunction<T[P]> },
): { [P in keyof T]?: ValidationErrors } {

    const res: { [P in keyof T]?: ValidationErrors } = { };

    Object.keys(obj).forEach(k => {
        const kk = k as keyof T;
        const validator: ValidatorFunction<T[typeof kk]> = validators[kk];
        if (!validator) {
            return;
        }

        const v = obj[k as keyof T];
        // let str: string;
        // if (typeof v === 'number') {
        //     str = v + '';
        // }

        // if (typeof v !== 'string') {
        //     return; // skip non-strings
        // }

        // str = v;

        const err = validator(v);
        if (err) {
            res[kk] = err;
        }
    });

    return res;
}

