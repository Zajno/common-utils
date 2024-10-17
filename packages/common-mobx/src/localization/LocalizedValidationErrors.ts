import { action, makeObservable, observable } from 'mobx';
import { IErrorsLocalization, ILocalizationDependency, ValidationErrorsFactory, ValidationErrorsStrings } from './abstractions.js';
import { AnyObject } from '@zajno/common/types/index';

export class LocalizedValidationErrors<TStrings extends AnyObject, TErrors extends string | number>
    implements IErrorsLocalization<TErrors>, ILocalizationDependency<TStrings> {

    private _strings: ValidationErrorsStrings<TErrors> | null = null;

    constructor(private readonly factory: ValidationErrorsFactory<TStrings, TErrors>) {
        makeObservable<LocalizedValidationErrors<TStrings, string>, '_strings'>(this, {
            _strings: observable.ref,
            updateLocale: action,
        });
    }

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
