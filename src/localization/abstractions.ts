
export interface ILocalization<TStrings extends { }> {
    readonly Current: Readonly<TStrings>;
}

export interface IErrorsLocalization<TErrors extends string | number> {
    readonly Errors: ValidationErrorsStrings<TErrors>
}

export interface ILocalizationDependency<TStrings extends { }, TLocale extends string = any> {
    updateLocale(strings: TStrings, locale?: TLocale): void;
}

export type ValidationErrorsStrings<T extends string | number> = Partial<Record<T, string>>;

export type ValidationErrorsFactory<TStrings extends { }, TErrors extends string | number> = (strings: TStrings) => ValidationErrorsStrings<TErrors>;
