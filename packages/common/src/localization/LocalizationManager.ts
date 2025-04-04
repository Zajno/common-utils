import type { ILocalization, LocaleStrings, StringsDataSource, StringsLoader } from './abstractions.js';
import type { AnyObject } from '../types/misc.js';
import { Event } from '../observing/event.js';

export class LocalizationManager<TLocaleType extends string, TStrings extends AnyObject> implements ILocalization<TStrings> {
    // initial value is intentionally a nonsense to be updated on first useLocale call
    private _currentLocale: TLocaleType = '' as TLocaleType;
    private _currentStrings: TStrings | null = null;

    private readonly _localeUpdatedEvent = new Event<LocaleStrings<TLocaleType, TStrings>>();
    private readonly _firstInit: Promise<void>;

    constructor(
        private readonly _dataSource: StringsDataSource<TLocaleType, TStrings>,
        locale: TLocaleType,
        fallbackStrings: TStrings | null = null,
    ) {
        this._currentStrings = fallbackStrings;

        this._firstInit = this.useLocale(locale);
    }

    public get Locale() { return this._currentLocale; }
    public get Current() { return this._currentStrings!; }

    public get firstInitialized() { return this._firstInit; }

    public get localeUpdated() { return this._localeUpdatedEvent.expose(); }

    /**
     * Updates locale synchronously, and then loads corresponding strings from datasource.
     * If loader for the locale is sync, this method updates instantly and returns resolved Promise.
     * Otherwise, strings will be updated asynchronously.
     */
    public useLocale(locale: TLocaleType): Promise<void> {
        if (locale === this._currentLocale) {
            return Promise.resolve();
        }

        // set locale immediately so it won't be updated twice in case instant second call
        this._currentLocale = locale;

        const loader: StringsLoader<TStrings> | null = this._dataSource[locale];
        if (!loader) {
            return this.doUpdateStrings(locale, null);
        }

        if (typeof loader !== 'function') {
            return this.doUpdateStrings(locale, loader);
        }

        // async part is separated to make the method synchronous
        return (async () => {
            let result: TStrings | null = null;
            try {
                result = await loader();
            } catch (e) {
                throw new Error(
                    `LocalizationManager: Failed to load localization data for locale "${locale}"`,
                    { cause: e },
                );
            } finally {
                this.doUpdateStrings(locale, result);
            }
        })();
    }

    protected doUpdateStrings(locale: TLocaleType, strings: TStrings | null) {
        if (!strings) {
            return Promise.reject(
                new Error(`LocalizationManager: No localization data for locale "${locale}"`),
            );
        }

        this._currentStrings = strings;

        this._localeUpdatedEvent.trigger({
            locale: this._currentLocale,
            strings: this._currentStrings,
        });

        return Promise.resolve();
    }
}
