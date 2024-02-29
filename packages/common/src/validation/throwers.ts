

/** A validation method that is not tied to ValidationErrors but instead should just throw an Error with error messages */
export type ValidationThrower<T> = (value: T) => Promise<void> | void;

export namespace ValidationThrower {
    export async function isValid<T>(value: T, validator: ValidationThrower<T>): Promise<boolean> {
        try {
            await validator(value);
            return true;
        } catch (e) {
            return false;
        }
    }
}

export interface ValidationGenericLike<T> {
    validate(value: T): Promise<unknown>;
}

export type ValidatorsSchema = Record<string, ValidationGenericLike<any>>;

export type ValidatorThrowers<T extends ValidatorsSchema> = {
    [P in (string & keyof T)]: T[P] extends ValidationGenericLike<infer K> ? ValidationThrower<K> : never;
};

export function createThrowers<T extends ValidatorsSchema>(validators: T): ValidatorThrowers<T> {
    return Object.entries(validators).reduce((acc, [key, validator]) => {
        const kk = key as (string & keyof T);
        if ('validate' in validator) {
            acc[kk] = (async (v: any) => {
                await validator.validate(v);
            }) as any;
        }

        return acc;
    }, {} as ValidatorThrowers<T>);
}
