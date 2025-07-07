import { ObjectMath } from '../math.js';
import type { RoundOptions } from '../types.js';

type Struct = {
    a: number;
    b: number;
};

describe('math/object/math', () => {
    const math = new ObjectMath<Struct>(['a', 'b']);

    it('getTotal', () => {
        expect(math.getTotal({ a: 1, b: 2 })).toBe(3);
        expect(math.getTotal(null)).toBe(0);
        expect(math.getTotal(undefined)).toBe(0);
    });

    it('contains', () => {
        expect(math.contains({ a: 5, b: 10 }, { a: 3, b: 4 })).toBe(true);
        expect(math.contains({ a: 5, b: 10 }, { a: 6, b: 4 })).toBe(false);
        expect(math.contains(null, { a: 3, b: 4 })).toBe(false);
        expect(math.contains({ a: 5, b: 10 }, null)).toBe(true);
    });

    it('inverse', () => {
        expect(math.inverse({ a: 1, b: 2 })).toEqual({ a: -1, b: -2 });
        expect(math.inverse({ a: -1, b: 2 })).toEqual({ a: 1, b: -2 });
        expect(math.inverse(null)).toEqual({ a: -0, b: -0 }); // wtf?
    });

    it('div', () => {
        expect(math.div({ a: 4, b: 8 }, 2)).toEqual({ a: 2, b: 4 });
        expect(math.div({ a: 4, b: 8 }, { a: 2, b: 4 })).toBe(2);
        expect(math.div({ a: 4, b: 8 }, { a: 2, b: 0 })).toBe(2);
        expect(math.div({ a: 4, b: 8 }, { a: 0, b: 0 })).toBe(0);
        expect(math.div(null, { a: 2, b: 4 })).toEqual(0);
        expect(math.div({ a: 4, b: 8 }, null)).toEqual(0);
        expect(math.div({ a: 4, b: 8 }, 0)).toEqual(0);
    });

    it('abs', () => {
        expect(math.abs({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
        expect(math.abs({ a: -1, b: 2 })).toEqual({ a: 1, b: 2 });
        expect(math.abs(null)).toEqual(null);

        expect(math.abs({ a: -1, b: 2 }, 'zero')).toEqual({ a: 0, b: 2 });
        expect(math.abs({ a: 1, b: -2 }, 'zero')).toEqual({ a: 1, b: 0 });

        expect(math.abs({ a: -1, b: 2 }, 'remove')).toEqual({ b: 2 });
        expect(math.abs({ a: 1, b: -2 }, 'remove')).toEqual({ a: 1 });
    });

    it('round', () => {
        expect(math.round({ a: 1.5, b: 2.5 })).toEqual({ a: 2, b: 3 });
        expect(math.round({ a: -1.5, b: 2.5 })).toEqual({ a: Math.round(-1.5), b: 3 });
        expect(math.round(null)).toEqual(null);

        expect(math.round({ a: 1.5, b: 2.5 }, 'floor')).toEqual({ a: 1, b: 2 });
        expect(math.round({ a: -1.5, b: 2.5 }, 'floor')).toEqual({ a: Math.floor(-1.5), b: 2 });

        expect(math.round({ a: 1.5, b: 2.5 }, 'ceil')).toEqual({ a: 2, b: 3 });
        expect(math.round({ a: -1.5, b: 2.5 }, 'ceil')).toEqual({ a: Math.ceil(-1.5), b: 3 });

        expect(math.round({ a: 1.5, b: 2.5 }, 'asdasd' as RoundOptions)).toEqual({ a: 1.5, b: 2.5 });
        expect(math.round({ a: -1.5, b: 2.5 }, 'asdasd' as RoundOptions)).toEqual({ a: -1.5, b: 2.5 });
    });

    it('add', () => {
        expect(math.add({ a: 1, b: 2 }, { a: 3, b: 4 })).toEqual({ a: 4, b: 6 });
        expect(math.add(null, { a: 3, b: 4 })).toEqual({ a: 3, b: 4 });
        expect(math.add({ a: 1, b: 2 }, null)).toEqual({ a: 1, b: 2 });
        expect(math.add(null, null)).toEqual({ a: 0, b: 0 });
    });

    it('subtract', () => {
        expect(math.subtract({ a: 5, b: 10 }, { a: 3, b: 4 })).toEqual({ a: 2, b: 6 });
        expect(math.subtract({ a: 5, b: 10 }, { a: 6, b: 4 })).toEqual({ a: -1, b: 6 });
        expect(math.subtract(null, { a: 3, b: 4 })).toEqual({ a: -3, b: -4 });
        expect(math.subtract({ a: 5, b: 10 }, null)).toEqual({ a: 5, b: 10 });
        expect(math.subtract(null, null)).toEqual({ a: 0, b: 0 });
    });


});
