import creditCard from './creditCard';
import { ValidationErrors } from './ValidationErrors';

const RE = {
    // There is at least first and last name
    // eslint-disable-next-line no-useless-escape
    name: /^[a-z,\.'-]+( +[a-z,\.'-]+)+$/i,
    englishLetters: /^([a-zA-Z\s]+)$/,
    email: /^([a-zA-Z0-9_.-\\+])+@([a-zA-Z0-9_.-])+\.([a-zA-Z])+([a-zA-Z])+/,

    // At least one English letter, (?=.*?[a-zA-Z])
    // At least one digit, (?=.*?[0-9])
    // At least one special character, (?=.*?[#?!@$%^&*-])
    // Minimum eight in length .{8,} (with the anchors)
    password: /^((?=.*?[a-z])|(?=.*?[A-Z])]|(?=.*?[0-9])).{8,}$/,

    // only digit & special character (+)
    onlyDigit: /^\d+$/,
    creditCardNumber: /^\d+$/,
    expiryDateCard: /^\d+$/,
    cvv: /^\d+$/,
    // eslint-disable-next-line no-useless-escape
    website: /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
    linkedin: /^(http:\/\/www\.linkedin\.com\/in\/|https:\/\/www\.linkedin\.com\/in\/|http:\/\/linkedin\.com\/in\/|https:\/\/linkedin\.com\/in\/|www\.linkedin\.com\/in\/|linkedin\.com\/in\/)[\w-/]+$/,
};

export const Validators = {

    notEmpty: <T = string>(val: T) => val ? ValidationErrors.None : ValidationErrors.ShouldBeNonEmpty,

    firstName: <T = string>(val: T) => val ? ValidationErrors.None : ValidationErrors.FirstName,
    lastName: <T = string>(val: T) => val ? ValidationErrors.None : ValidationErrors.LastName,
    occupation: <T = string>(val: T) => val ? ValidationErrors.None : ValidationErrors.Occupation,
    goal: <T = string>(val: T) => val ? ValidationErrors.None : ValidationErrors.Goal,

    fullName: (val: string) => RE.name.test(val.trim()) ? ValidationErrors.None : ValidationErrors.InvalidNameFormat,
    onlyEnglish: (val: string) => RE.englishLetters.test(val) ? ValidationErrors.None : ValidationErrors.OnlyEnglishLetters,
    email: (val: string) => RE.email.test(val) ? ValidationErrors.None : ValidationErrors.InvalidEmailFormat,
    password: (val: string) => RE.password.test(val) ? ValidationErrors.None : ValidationErrors.InvalidPasswordFormat,
    onlyDigit: (val: string) => RE.onlyDigit.test(val) ? ValidationErrors.None : ValidationErrors.OnlyDigit,
    creditCardNumber: (val: string) => {
        const shortVal = val.replace(/ /gi, '');
        const valid = RE.creditCardNumber.test(shortVal) && shortVal.length === creditCard.getDigitsCount(shortVal);
        return valid ? ValidationErrors.None : ValidationErrors.InvalidCreditCardFormat;
    },
    creditCardExpiryDate: (val: string) => {
        const shortVal = val.replace(/\//gi, '');
        const valid = (RE.expiryDateCard.test(shortVal) && shortVal.length === 4);
        return valid ? ValidationErrors.None : ValidationErrors.InvalidCreditCardExpiryDateFormat;
    },
    creditCardCvv: (val: string) =>
        (RE.cvv.test(val) && val.length >= 3 && val.length <= 4) ? ValidationErrors.None : ValidationErrors.InvalidCreditCardCvvFormat,
    website: (val: string) => RE.website.test(val) ? ValidationErrors.None : ValidationErrors.Website,
    linkedin: (val: string) => RE.linkedin.test(val) ? ValidationErrors.None : ValidationErrors.Linkedin,
};
