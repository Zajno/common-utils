import EnumHelper from '../enumHelper';

export enum ValidationErrors {
    None = 0,
    ShouldBeNonEmpty,
    ShouldBeEqualTo,
    InvalidNameFormat,
    InvalidEmailFormat,
    InvalidPasswordFormat,
    OnlyEnglishLetters,
    InvalidPhoneFormat,
    InvalidCreditCardFormat,
    InvalidCreditCardExpiryDateFormat,
    InvalidCreditCardCvvFormat,
    OnlyDigit,

    EmailIsInUse,
    FirstName,
    LastName,
    Occupation,
    Goal,
    Website,
    Linkedin,
}

export namespace ValidationErrors {
    export const Helper = new EnumHelper<ValidationErrors>(ValidationErrors);
}
