import 'jest-extended';

export const expectAnythingOrNothing = expect.toBeOneOf([expect.anything(), undefined, null]);
