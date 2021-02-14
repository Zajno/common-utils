import { throwNotOk } from './helpers';
import { ValidatorFunction } from './types';
import { ValidationErrors } from './ValidationErrors';
import { Validators } from './validators';

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
