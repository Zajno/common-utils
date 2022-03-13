import { action, observable } from 'mobx';
import { IErrorsLocalization, ILocalizationDependency, ValidationErrorsFactory, ValidationErrorsStrings } from './abstractions';

export class LocalaziedValidationErrors<TStrings extends { }, TErrors extends string | number>
    implements IErrorsLocalization<TErrors>, ILocalizationDependency<TStrings> {

    @observable.ref
    private _strings: ValidationErrorsStrings<TErrors> = null;

    constructor(private readonly factory: ValidationErrorsFactory<TStrings, TErrors>) { }

    public get Errors(): Partial<Record<TErrors, string>> { return this._strings; }

    @action
    public updateLocale(strings: TStrings): void {
        this._strings = this.factory(strings);
    }
}
