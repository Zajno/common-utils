
export * from './calc.js';
export * from './arrays.js';
export * from './distribution.js';

export function getNumberSuffix(num: number) {
    const lastDigit = (num || 0) % 10;

    switch (lastDigit) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

export function format(n: number, digits?: number) {
    const res = n.toString();
    if (digits && digits > res.length) {
        return res.padStart(digits, '0');
    }
    return res;
}
