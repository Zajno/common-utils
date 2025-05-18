import type {
    IErrorsLocalization,
    ValidationErrorsFactory,
    ValidationErrorsStrings,
} from './abstractions.js';
import type { AnyObject } from '../types/misc.js';

export class LocalizedValidationErrors<TStrings extends AnyObject, TErrors extends string | number>
    implements IErrorsLocalization<TErrors> {

    private _strings: ValidationErrorsStrings<TErrors> | null = null;

    constructor(private readonly factory: ValidationErrorsFactory<TStrings, TErrors>) { }

    public get Errors(): Partial<Record<TErrors, string>> {
        if (!this._strings) {
            throw new Error('No strings provided, call updateLocale first');
        }

        return this._strings;
    }

    public updateLocale(strings: TStrings): void {
        this._strings = this.factory(strings);
    }
}
