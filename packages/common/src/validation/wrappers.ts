import { throwNotOk } from './helpers.js';
import type { ValidatorFunction } from './types.js';
import { ValidationErrors } from './ValidationErrors.js';
import { Validators } from './validators.js';

export const Wrappers = {
    required<T = string>(validator: ValidatorFunction<T>): ValidatorFunction<T> {
        return (val: T): ValidationErrors => {
            return Validators.notEmpty(val) || validator(val);
        };
    },

    notRequired<T = string>(validator: ValidatorFunction<T>): ValidatorFunction<T> {
        return (val: T): ValidationErrors => {
            return Validators.notEmpty(val) === ValidationErrors.ShouldBeNonEmpty
                ? ValidationErrors.None
                : validator(val);
        };
    },

    thrower<T = string>(validator: ValidatorFunction<T>) {
        return (val: T) => {
            throwNotOk(validator(val));
        };
    },
};
