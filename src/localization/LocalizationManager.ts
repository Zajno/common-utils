import { observable, makeObservable, action } from 'mobx';
import { ILocalization, ILocalizationDependency } from './abstractions';

export class LocalizationManager<TLocaleType extends string, TStrings extends { }> implements ILocalization<TStrings> {
    @observable
    private _currentLocale: TLocaleType = null;

    @observable.ref
    private _currentStrings: TStrings = null;

    private readonly _defaultStrings: TStrings = null;
    private readonly _dependants: ILocalizationDependency<TStrings, TLocaleType>[] = [];

    constructor(
        private readonly _dataSource: { [locale: string]: TStrings },
        initialLocale: TLocaleType,
        defaultLocale: TLocaleType = null,
    ) {
        makeObservable(this);
        this._defaultStrings = this.getStrings(defaultLocale || initialLocale);
        this.useLocale(initialLocale);
    }

    public get Locale() { return this._currentLocale; }
    public get Current() { return this._currentStrings; }

    @action
    public useLocale(locale: TLocaleType) {
        this._currentLocale = locale;
        this._currentStrings = this.getStrings(this._currentLocale) || this._defaultStrings;
        this.updateDependencies();
        return this;
    }

    public useDependency(dep: ILocalizationDependency<TStrings, TLocaleType>, remove = false) {
        const i = this._dependants.indexOf(dep);
        if (i < 0 && !remove) {
            this._dependants.push(dep);
            this.updateDependencies();
        } else if (i >= 0 && remove) {
            this._dependants.splice(i, 1);
        }
        return this;
    }

    private updateDependencies() {
        this._dependants.forEach(d => d.updateLocale(this._currentStrings, this._currentLocale));
    }

    private getStrings(locale: string): TStrings {
        return this._dataSource[locale];
    }
}
