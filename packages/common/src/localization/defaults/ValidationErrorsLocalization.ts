import { ValidationErrorsStrings } from '../abstractions.js';
import { StringsShape } from './defaultShape.js';
import { LocalizedValidationErrors } from '../LocalizedValidationErrors.js';
import { ValidationErrors } from '../../validation/ValidationErrors.js';

function locationFactory(strings: StringsShape): ValidationErrorsStrings<ValidationErrors> {
    return {
        [ValidationErrors.None]: '',
        [ValidationErrors.ShouldBeNonEmpty]: strings.Validation.Empty,
        [ValidationErrors.InvalidNameFormat]: strings.Validation.Name,
        [ValidationErrors.InvalidEmailFormat]: strings.Validation.Email,
        [ValidationErrors.InvalidPasswordFormat]: strings.Validation.Password,
        [ValidationErrors.OnlyEnglishLetters]: strings.Validation.EnglishOnly,
        [ValidationErrors.InvalidPhoneFormat]: strings.Validation.Phone,
        [ValidationErrors.InvalidCreditCardFormat]: strings.Validation.CreditCard,
        [ValidationErrors.InvalidCreditCardExpiryDateFormat]: strings.Validation.CreditCardExpiryDate,
        [ValidationErrors.InvalidCreditCardCvvFormat]: strings.Validation.CreditCardCvv,

        [ValidationErrors.FirstName]: strings.Validation.FirstName,
        [ValidationErrors.LastName]: strings.Validation.LastName,
        [ValidationErrors.OnlyDigit]: strings.Validation.OnlyDigit,
        [ValidationErrors.Website]: strings.Validation.Website,
        [ValidationErrors.Linkedin]: strings.Validation.Linkedin,
    };
}

export const ValidationErrorsLocalized = new LocalizedValidationErrors<StringsShape, ValidationErrors>(locationFactory);
