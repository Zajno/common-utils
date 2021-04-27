import EnumHelper, { } from '../enumHelper';

enum Enum {
    Val1 = 1,
    Val2 = 2,
}

describe('enumHelper', () => {
    const helper = new EnumHelper(Enum);

    it('runs correctly', () => {
        expect(helper.Keys).toEqual(['Val1', 'Val2']);
        expect(helper.Values).toEqual([Enum.Val1, Enum.Val2]);
    });
});
