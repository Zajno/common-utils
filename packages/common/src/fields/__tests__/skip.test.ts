import { SkipOptions, SkipCondition } from '../skip.js';

describe('fields/skip', () => {
    it('shouldSkip', () => {
        expect(SkipOptions.shouldSkip(true, true)).toBe(false);
        expect(SkipOptions.shouldSkip(true, false)).toBe(false);
        expect(SkipOptions.shouldSkip(true, 'falsy')).toBe(false);
        expect(SkipOptions.shouldSkip(true, 'null')).toBe(false);

        expect(SkipOptions.shouldSkip(false, true)).toBe(true);
        expect(SkipOptions.shouldSkip(false, false)).toBe(false);
        expect(SkipOptions.shouldSkip(false, 'falsy')).toBe(true);
        expect(SkipOptions.shouldSkip(false, 'null')).toBe(false);

        expect(SkipOptions.shouldSkip(undefined, true)).toBe(true);
        expect(SkipOptions.shouldSkip(undefined, false)).toBe(false);
        expect(SkipOptions.shouldSkip(undefined, 'falsy')).toBe(true);
        expect(SkipOptions.shouldSkip(undefined, 'null')).toBe(true);

        expect(SkipOptions.shouldSkip(null, true)).toBe(true);
        expect(SkipOptions.shouldSkip(null, false)).toBe(false);
        expect(SkipOptions.shouldSkip(null, 'falsy')).toBe(true);
        expect(SkipOptions.shouldSkip(null, 'null')).toBe(true);

        expect(SkipOptions.shouldSkip(1, true)).toBe(false);
        expect(SkipOptions.shouldSkip(1, false)).toBe(false);
        expect(SkipOptions.shouldSkip(1, 'falsy')).toBe(false);
        expect(SkipOptions.shouldSkip(1, 'null')).toBe(false);

        expect(SkipOptions.shouldSkip('1', true)).toBe(false);
        expect(SkipOptions.shouldSkip('1', false)).toBe(false);
        expect(SkipOptions.shouldSkip('1', 'falsy')).toBe(false);
        expect(SkipOptions.shouldSkip('1', 'null')).toBe(false);
    });

    it('skipCondition', () => {
        expect(SkipCondition.shouldSkip<{ a: number }>(
            (_key, val) => val != null && val > 3,
            'a',
            5,
        )).toBe(true);

        expect(SkipCondition.shouldSkip<{ a: number }>(
            (_key, val) => val != null && val < 3,
            'a',
            5,
        )).toBe(false);

        expect(SkipCondition.shouldSkip<{ a?: number }>(
            'falsy',
            'a',
            0,
        )).toBe(true);

        expect(SkipCondition.shouldSkip<{ a?: number }>(
            'falsy',
            'a',
            5,
        )).toBe(false);
    });
});
