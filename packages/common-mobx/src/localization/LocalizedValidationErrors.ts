import { action, makeObservable, observable } from 'mobx';
import type { AnyObject } from '@zajno/common/types';
import {
    LocalizedValidationErrors as _LocalizedValidationErrors,
    type ValidationErrorsFactory,
} from '@zajno/common/localization/index';

export class LocalizedValidationErrors<TStrings extends AnyObject, TErrors extends string | number>
    extends _LocalizedValidationErrors<TStrings, TErrors> {

    constructor(factory: ValidationErrorsFactory<TStrings, TErrors>) {
        super(factory);

        makeObservable<LocalizedValidationErrors<TStrings, string>, '_strings'>(this, {
            _strings: observable.ref,
            updateLocale: action,
        });
    }
}
