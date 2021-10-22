import * as calc from '../calc';

describe('math/calc', () => {
    it('clamp', () => {
        expect(calc.clamp(123)).toBe(123);
        expect(calc.clamp(123, 10)).toBe(123);
        expect(calc.clamp(0, 1, 2, false)).toBe(1);
        expect(calc.clamp(0, 1, 2, true)).toBe(2);
        expect(calc.clamp(3, 1, 2, false)).toBe(2);
        expect(calc.clamp(3, 1, 2, true)).toBe(1);
        expect(calc.clamp(15, 10, 20, false)).toBe(15);
        expect(calc.clamp(15, 10, 20, true)).toBe(15);
    });

    it('clamp01', () => {
        expect(calc.clamp01(-1)).toBe(0);
        expect(calc.clamp01(0)).toBe(0);
        expect(calc.clamp01(0.5)).toBe(0.5);
        expect(calc.clamp01(1)).toBe(1);
        expect(calc.clamp01(2)).toBe(1);
    });

    it('contains', () => {
        expect(calc.contains(1, 2, 3)).toBe(false);
        expect(calc.contains(1, 3, 2)).toBe(false);
        expect(calc.contains(15, 10, 20)).toBe(true);
        expect(calc.contains(15, 20, 10)).toBe(true);
    });

    it('getIntersection', () => {
        expect(calc.getIntersection(1, 2, 3, 4)).toBeFalsy();
        expect(calc.getIntersection(1, 3, 1, 4)).toBeTruthy();
    });

    it('roundNumber', () => {
        expect(calc.roundNumber(10)).toBe(10);
        expect(calc.roundNumber(10.1)).toBe(10.1);
        expect(calc.roundNumber(10.12)).toBe(10.12);
        expect(calc.roundNumber(10.123)).toBe(10.12);
        expect(calc.roundNumber(10.1234)).toBe(10.12);
        expect(calc.roundNumber(10.1234, 4)).toBe(10.1234);
        expect(calc.roundNumber(10.1235, 3)).toBe(10.124);
        expect(calc.roundNumber(10.1234, 3, 'ceil')).toBe(10.124);
        expect(calc.roundNumber(10.1239, 3, 'floor')).toBe(10.123);
    });

    it('roundHalf', () => {
        expect(calc.roundHalf(12.213)).toBe(12);
        expect(calc.roundHalf(12.999)).toBe(13);
    });

    describe('random', () => {
        const testRandom = (min: number, max: number, trunc = true) => {
            it(`[${min}, ${max}, ${trunc}]`, () => {
                const v = calc.random(min, max, trunc);
                expect(v).toBeGreaterThanOrEqual(min);
                expect(v).toBeLessThanOrEqual(max);
                expect(v - Math.trunc(v) > 0).not.toEqual(trunc);
            });
        };

        testRandom(0, 1, true);
        testRandom(0, 1, false);
        testRandom(1, 100, true);
        testRandom(1, 100, false);
    });
});
