export const Strings = {
    Ok: 'OK',
    Cancel: 'Cancel',
    Submit: 'Submit',
    ForgotPassword: 'Forgot password?',
    Validation: {
        Empty: 'Value should be not empty',
        Name: 'Invalid name format',
        Email: 'Incorrect email',
        Password: 'Must include at least 8 characters',
        EnglishOnly: 'Only English letters supported',
        Phone: 'Invalid phone number format: only digits allowed',
        CreditCard: 'Invalid credit card number format',
        CreditCardExpiryDate: 'Invalid expiry date format',
        CreditCardCvv: 'Invalid CVV format',
        PasswordsShouldMatch: 'Passwords should match',
        FirstName: 'First name is required',
        LastName: 'Last name is required',
        OnlyDigit: 'Only digits are valid',
        Website: 'Incorrect website',
        Linkedin: 'Incorrect Linkedin link',
    },
    UnknownServerError: 'Something went wrong and we were not able to process your request. Please contact the administrator.',
};

export type StringsShape = typeof Strings;
