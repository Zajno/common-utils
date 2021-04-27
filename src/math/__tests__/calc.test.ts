import * as calc from '../calc';

describe('math/calc', () => {
    it('clamp', () => {
        expect(calc.clamp(123)).toEqual(123);
        expect(calc.clamp(123, 10)).toEqual(123);
        expect(calc.clamp(0, 1, 2, false)).toEqual(1);
        expect(calc.clamp(0, 1, 2, true)).toEqual(2);
        expect(calc.clamp(3, 1, 2, false)).toEqual(2);
        expect(calc.clamp(3, 1, 2, true)).toEqual(1);
        expect(calc.clamp(15, 10, 20, false)).toEqual(15);
        expect(calc.clamp(15, 10, 20, true)).toEqual(15);
    });

    it('clamp01', () => {
        expect(calc.clamp01(-1)).toEqual(0);
        expect(calc.clamp01(0)).toEqual(0);
        expect(calc.clamp01(0.5)).toEqual(0.5);
        expect(calc.clamp01(1)).toEqual(1);
        expect(calc.clamp01(2)).toEqual(1);
    });

    it('contains', () => {
        expect(calc.contains(1, 2, 3)).toEqual(false);
        expect(calc.contains(1, 3, 2)).toEqual(false);
        expect(calc.contains(15, 10, 20)).toEqual(true);
        expect(calc.contains(15, 20, 10)).toEqual(true);
    });

    it('getIntersection', () => {
        expect(calc.getIntersection(1, 2, 3, 4)).toBeFalsy();
        expect(calc.getIntersection(1, 3, 1, 4)).toBeTruthy();
    });

    it('roundNumber', () => {
        expect(calc.roundNumber(10)).toEqual(10);
        expect(calc.roundNumber(10.1)).toEqual(10.1);
        expect(calc.roundNumber(10.12)).toEqual(10.12);
        expect(calc.roundNumber(10.123)).toEqual(10.12);
        expect(calc.roundNumber(10.1234)).toEqual(10.12);
        expect(calc.roundNumber(10.1234, 4)).toEqual(10.1234);
        expect(calc.roundNumber(10.1235, 3)).toEqual(10.124);
        expect(calc.roundNumber(10.1234, 3, 'ceil')).toEqual(10.124);
        expect(calc.roundNumber(10.1239, 3, 'floor')).toEqual(10.123);
    });

    it('roundHalf', () => {
        expect(calc.roundHalf(12.213)).toEqual(12);
        expect(calc.roundHalf(12.999)).toEqual(13);
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
