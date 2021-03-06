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
        Occupation: 'What\'s your client\'s job?',
        Goal: 'Choose a goal to achieve',
        OnlyDigit: 'Only digits are valid',
        Website: 'Incorrect website',
        Linkedin: 'Incorrect Linkedin link',
    },
    UnknownServerError: 'Something went wrong and we were not able to process your request. Please contact the administrator.',
    ClientStatuses: {
        Active: 'Active',
        Invited: 'Invited',
        Inactive: 'Inactive',
    },
    BubbleChartStatus: {
        Things: 'Things',
        People: 'People',
        Places: 'Places',
    },
    Locations: {
        AtWork: 'At work',
        OnAWalk: 'On a walk',
        InThePark: 'At the park',
        Somewhere: 'Somewhere else',
        AtHome: 'At home',
        InTransit: 'In transition',
    },
    Sentiments: {
        Undefined: 'Unknown',
        VeryPositive: 'Very Positive',
        Positive: 'Positive',
        Mixed: 'Mixed',
        Difficult: 'Difficult',
        Rough: 'Rough',
    },
    Periods: {
        ThisWeek: 'this week',
        Month: 'this month',
        Months3: 'last 3 months',
        Months6: 'last 6 months',
    },
};

export type StringsShape = typeof Strings;
