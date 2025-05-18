import type { ValidationErrors } from './ValidationErrors.js';

export class ValidationError<TErrors = ValidationErrors> extends Error {
    readonly code: TErrors;

    constructor(message: string, code: TErrors) {
        super(message);
        this.code = code;
    }
}
