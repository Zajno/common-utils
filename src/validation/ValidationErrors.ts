import EnumHelper from '../structures/helpers/enum';

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
    Website,
    Linkedin,
}

export namespace ValidationErrors {
    export const Helper = new EnumHelper<ValidationErrors>(ValidationErrors);
}
