import { observable, makeObservable, action } from 'mobx';
import type { AnyObject } from '@zajno/common/types';
import { LocalizationManager as _LocalizationManager } from '@zajno/common/localization';

export class LocalizationManager<TLocaleType extends string, TStrings extends AnyObject> extends _LocalizationManager<TLocaleType, TStrings> {
    constructor(
        dataSource: { [locale: string]: TStrings },
        initialLocale: TLocaleType,
        defaultLocale: TLocaleType | null = null,
    ) {
        super(dataSource, initialLocale, defaultLocale);

        makeObservable<LocalizationManager<TLocaleType, TStrings>, '_currentLocale' | '_currentStrings'>(this, {
            _currentLocale: observable,
            _currentStrings: observable.ref,
            useLocale: action,
        });
    }
}
