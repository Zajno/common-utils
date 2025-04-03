import type { ILocalization, ILocalizationDependency } from './abstractions.js';
import type { AnyObject } from '../types/misc.js';
import { Event } from '../observing/event.js';

export class LocalizationManager<TLocaleType extends string, TStrings extends AnyObject> implements ILocalization<TStrings> {
    private _currentLocale: TLocaleType | null = null;
    private _currentStrings: TStrings | null = null;

    private readonly _defaultStrings: TStrings;
    private readonly _dependents: ILocalizationDependency<TStrings, TLocaleType>[] = [];

    private readonly _localeUpdatedEvent = new Event<TLocaleType>();

    constructor(
        private readonly _dataSource: { [locale: string]: TStrings },
        initialLocale: TLocaleType,
        defaultLocale: TLocaleType | null = null,
    ) {
        this._defaultStrings = this.getStrings(defaultLocale || initialLocale);
        this.useLocale(initialLocale);
    }

    public get Locale() { return this._currentLocale; }
    public get Current() { return this._currentStrings!; }
    public get localeUpdated() { return this._localeUpdatedEvent.expose(); }

    public useLocale(locale: TLocaleType) {
        this._currentLocale = locale;
        this._currentStrings = this.getStrings(this._currentLocale) || this._defaultStrings;
        this.updateDependencies();
        this._localeUpdatedEvent.trigger(this._currentLocale);
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
