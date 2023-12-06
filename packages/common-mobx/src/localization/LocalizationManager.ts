import { observable, makeObservable, action } from 'mobx';
import type { ILocalization, ILocalizationDependency } from './abstractions';
import type { AnyObject } from '@zajno/common/types/index';

export class LocalizationManager<TLocaleType extends string, TStrings extends AnyObject> implements ILocalization<TStrings> {
    @observable
    private _currentLocale: TLocaleType = null;

    @observable.ref
    private _currentStrings: TStrings = null;

    private readonly _defaultStrings: TStrings = null;
    private readonly _dependents: ILocalizationDependency<TStrings, TLocaleType>[] = [];

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
        this._dependents.forEach(d => d.updateLocale(this._currentStrings, this._currentLocale));
    }

    private getStrings(locale: string): TStrings {
        return this._dataSource[locale];
    }
}
