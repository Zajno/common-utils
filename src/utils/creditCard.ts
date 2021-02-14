const regexp = /^\D*3[47]/;

const types: { [digit: number]: string } = {
    0: 'credit-card-alt',
    3: 'cc-amex',
    4: 'cc-visa',
    5: 'cc-mastercard',
    6: 'cc-discover',
};

function getDigitsCount(val: string): number {
    return regexp.test(val) ? 15 : 16; // 15 digits if Amex
}

function getType(cardNumber: string) {
    const val = cardNumber + '';
    const firstDigit = +(val && val[0]) || 0;
    return types[firstDigit] || types[0];
}

export default {
    DEFAULT: types[0],
    getDigitsCount,
    getType,
};
