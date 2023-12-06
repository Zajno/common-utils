import EnumHelper from '../structures/helpers/enum';

export enum ValidationErrors {
    None = 0,

    // generic
    ShouldBeNonEmpty,
    ShouldBeEqualTo,
    InvalidFormat,
    Inconsistent,

    // specific to fields & data
    InvalidNameFormat,
    InvalidEmailFormat,
    InvalidPasswordFormat,
    OnlyEnglishLetters,
    InvalidPhoneFormat,
    InvalidCreditCardFormat,
    InvalidCreditCardExpiryDateFormat,
    InvalidCreditCardCvvFormat,
    OnlyDigit,

    // business logic
    EmailIsInUse,
    FirstName,
    LastName,
    Website,
    Linkedin,
}

export namespace ValidationErrors {
    export const Helper = new EnumHelper<ValidationErrors>(ValidationErrors);
}
