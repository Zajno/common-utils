import { observable, transaction, makeObservable } from 'mobx';
import { StringsShape } from './defaultShape';
import createValidationErrorsStrings, { ValidationErrorsStrings } from './validationErrorsStrings';
import { ILocalization } from './ILocalization';

export { ILocalization };

export default class LocalizationManager<TLocaleType extends string, TStrings extends StringsShape> implements ILocalization<TStrings> {
    @observable
    private _currentLocale: TLocaleType = null;

    @observable
    private _currentStrings: TStrings = null;

    @observable
    private _validationErrors: ValidationErrorsStrings = null;

    private readonly _defaultStrings: TStrings = null;

    constructor(
        private readonly _dataSource: { [locale: string]: TStrings },
        initialLocale: TLocaleType,
        defaultLocale: TLocaleType = null,
    ) {
        makeObservable(this);
        this._defaultStrings = this.getStrings(defaultLocale || initialLocale);
        this.updateStrings(initialLocale);
    }

    get Locale() { return this._currentLocale; }

    get Current() { return this._currentStrings; }

    get ValidationErrors() { return this._validationErrors; }

    updateStrings(locale: TLocaleType) {
        transaction(() => {
            this._currentLocale = locale;
            this._currentStrings = this.getStrings(this._currentLocale) || this._defaultStrings;
            this._validationErrors = createValidationErrorsStrings(this._currentStrings);
        });
    }

    private getStrings(locale: string): TStrings {
        return this._dataSource[locale];
    }
}
