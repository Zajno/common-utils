import type { AnyObject } from '../types/misc.js';

export interface ILocalization<TStrings extends AnyObject> {
    readonly Current: Readonly<TStrings>;
}

export interface IErrorsLocalization<TErrors extends string | number> {
    readonly Errors: ValidationErrorsStrings<TErrors>
}

export type StringsLoader<TStrings> = TStrings | (() => Promise<TStrings>);
export type StringsDataSource<TLocale extends string, TStrings extends AnyObject> = Record<TLocale, StringsLoader<TStrings>>;

export type LocaleStrings<TLocale extends string, TStrings extends AnyObject> = {
    locale: TLocale;
    strings: TStrings;
};

export type ValidationErrorsStrings<T extends string | number> = Partial<Record<T, string>>;

export type ValidationErrorsFactory<TStrings extends AnyObject, TErrors extends string | number> = (strings: TStrings) => ValidationErrorsStrings<TErrors>;
