import * as math from '../index';

describe('math', () => {
    it('getNumberSuffix', () => {
        expect(math.getNumberSuffix(1)).toBe('st');
        expect(math.getNumberSuffix(11)).toBe('st');
        expect(math.getNumberSuffix(11111)).toBe('st');

        expect(math.getNumberSuffix(2)).toBe('nd');
        expect(math.getNumberSuffix(1232)).toBe('nd');
        expect(math.getNumberSuffix(32412.99)).toBe('th');

        expect(math.getNumberSuffix(3)).toBe('rd');
        expect(math.getNumberSuffix(323)).toBe('rd');
        expect(math.getNumberSuffix(1233.233)).toBe('th');

        expect(math.getNumberSuffix(0)).toBe('th');
        expect(math.getNumberSuffix(145)).toBe('th');
    });
});
