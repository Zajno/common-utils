import { observable, makeObservable, action } from 'mobx';
import type { ILocalization, ILocalizationDependency } from './abstractions';
import type { AnyObject } from '@zajno/common/types/index';

export class LocalizationManager<TLocaleType extends string, TStrings extends AnyObject> implements ILocalization<TStrings> {
    private _currentLocale: TLocaleType | null = null;
    private _currentStrings: TStrings | null = null;

    private readonly _defaultStrings: TStrings;
    private readonly _dependents: ILocalizationDependency<TStrings, TLocaleType>[] = [];

    constructor(
        private readonly _dataSource: { [locale: string]: TStrings },
        initialLocale: TLocaleType,
        defaultLocale: TLocaleType | null = null,
    ) {
        makeObservable<LocalizationManager<string, AnyObject>, '_currentLocale' | '_currentStrings'>(this, {
            _currentLocale: observable,
            _currentStrings: observable.ref,
            useLocale: action,
        });
        this._defaultStrings = this.getStrings(defaultLocale || initialLocale);
        this.useLocale(initialLocale);
    }

    public get Locale() { return this._currentLocale; }
    public get Current() { return this._currentStrings!; }

    public useLocale(locale: TLocaleType) {
        this._currentLocale = locale;
        this._currentStrings = this.getStrings(this._currentLocale) || this._defaultStrings;
        this.updateDependencies();
        return this;
    }

    public useDependency(dep: ILocalizationDependency<TStrings, TLocaleType>, remove = false) {
        const i = this._dependents.indexOf(dep);
        if (i < 0 && !remove) {
            this._dependents.push(dep);
            this.updateDependencies();
        } else if (i >= 0 && remove) {
            this._dependents.splice(i, 1);
        }
        return this;
    }

    private updateDependencies() {
        const { _currentLocale: locale, _currentStrings: strings } = this;
        if (!strings || !locale) {
            return;
        }

        this._dependents.forEach(d => d.updateLocale(strings, locale));
    }

    private getStrings(locale: string): TStrings {
        return this._dataSource[locale];
    }
}
