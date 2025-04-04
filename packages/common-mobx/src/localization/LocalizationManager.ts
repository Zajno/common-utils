import { observable, makeObservable, action } from 'mobx';
import type { AnyObject } from '@zajno/common/types';
import { LocalizationManager as _LocalizationManager, StringsDataSource } from '@zajno/common/localization';

export class LocalizationManager<TLocaleType extends string, TStrings extends AnyObject> extends _LocalizationManager<TLocaleType, TStrings> {
    constructor(
        dataSource: StringsDataSource<TLocaleType, TStrings>,
        initialLocale: TLocaleType,
        fallbackStrings: TStrings | null = null,
    ) {
        super(dataSource, initialLocale, fallbackStrings);

        makeObservable<LocalizationManager<TLocaleType, TStrings>, '_currentLocale' | '_currentStrings' | 'doUpdateStrings'>(this, {
            _currentLocale: observable,
            _currentStrings: observable.ref,
            useLocale: action,
            doUpdateStrings: action,
        });
    }
}
