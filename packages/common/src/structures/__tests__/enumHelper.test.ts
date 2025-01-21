import { EnumHelper, EnumBitwiseHelper, EnumStringHelper } from '../helpers/enum.js';

enum Enum {
    Val1 = 1,
    Val2 = 2,
}

describe('EnumHelper', () => {
    const helper = new EnumHelper(Enum);

    it('runs correctly', () => {
        expect(helper.Keys).toEqual(['Val1', 'Val2']);
        expect(helper.Values).toEqual([Enum.Val1, Enum.Val2]);
        expect(helper.keyToString('Val1', { [Enum.Val1]: 'kek' })).toBe('kek');
        expect(helper.keyToValue('Val1')).toBe(Enum.Val1);
        expect(helper.valueToString(Enum.Val1, { [Enum.Val1]: 'kek' })).toBe('kek');
        expect(helper.validateValue(1)).toBe(Enum.Val1);
        expect(helper.validateValue(123)).toBeNull();
        expect(helper.validateValue(null)).toBeNull();
    });
});

enum EnumString {
    A = 'a',
    B = 'b',
}

describe('EnumStringHelper', () => {
    const helper = new EnumStringHelper<EnumString>(EnumString);

    it('runs correctly', () => {
        expect(helper.Keys).toEqual(['A', 'B']);
        expect(helper.Values).toEqual([EnumString.A, EnumString.B]);
        expect(helper.keyToString('A')).toBe('A');
        expect(helper.valueToString(EnumString.A)).toBe(EnumString.A);

        expect(helper.validateValue('a')).toBe(EnumString.A);
        expect(helper.validateValue('123')).toBeNull();
        expect(helper.validateValue(null)).toBeNull();
    });
});

enum EnumBitwise {
    One = 1 << 0,
    Two = 1 << 1,

    Three = One | Two,
}

describe('EnumBitwiseHelper', () => {
    const helper = new EnumBitwiseHelper<EnumBitwise>(EnumBitwise, {
        [EnumBitwise.One]: 'one',
        [EnumBitwise.Two]: 'two',
        [EnumBitwise.Three]: 'three',
    });

    it('runs correctly', () => {
        expect(helper.Keys).toEqual(['One', 'Two', 'Three']);
        expect(helper.Values).toEqual([EnumBitwise.One, EnumBitwise.Two, EnumBitwise.Three]);
        expect(helper.keyToString('One')).toBe('one');
        expect(helper.valueToString(EnumBitwise.One)).toBe('one');

        expect(helper.validateValue(EnumBitwise.One)).toBe(EnumBitwise.One);
        expect(helper.validateValue(6)).toBeNull();
        expect(helper.validateValue(null)).toBeNull();

        expect(helper.toStrings(0 as EnumBitwise)).toStrictEqual([undefined]);
        expect(helper.toStrings(EnumBitwise.One)).toStrictEqual(['one']);
        expect(helper.toStrings(EnumBitwise.Three)).toStrictEqual(['one', 'two', 'three']);

        expect(helper.toString(EnumBitwise.Three)).toBe('one, two, three');

        expect(helper.contains(EnumBitwise.Three, EnumBitwise.One)).toBe(true);
        expect(helper.contains(EnumBitwise.Three, EnumBitwise.Two)).toBe(true);
        expect(helper.contains(EnumBitwise.One, EnumBitwise.Two)).toBe(false);
        expect(helper.contains(EnumBitwise.Two, EnumBitwise.One)).toBe(false);
        expect(helper.contains(EnumBitwise.One, 0 as EnumBitwise)).toBe(true);

        expect(helper.combine(EnumBitwise.One, EnumBitwise.Two)).toBe(EnumBitwise.Three);
        expect(helper.combine(EnumBitwise.One)).toBe(EnumBitwise.One);
        expect(helper.combine(EnumBitwise.One, 0 as EnumBitwise)).toBe(EnumBitwise.One);

        expect(helper.remove(EnumBitwise.Three, EnumBitwise.Two)).toBe(EnumBitwise.One);
    });
});
