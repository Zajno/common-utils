import { CompositeObjectMath } from '../math.composite.js';
import { describe, expect, it } from 'vitest';
import { ObjectMath } from '../math.js';

describe('math/object/math.composite', () => {
    type ChildStruct = { a?: number; b?: number };
    const baseMath = new ObjectMath<ChildStruct>(['a', 'b']);
    type Struct = { child?: ChildStruct };
    const math = new CompositeObjectMath<Struct>({ child: baseMath });

    it('contains', () => {
        expect(math.contains({ child: { a: 5, b: 10 } }, { child: { a: 3, b: 4 } })).toBe(true);
        expect(math.contains({ child: { a: 5, b: 10 } }, { child: { a: 6, b: 4 } })).toBe(false);
        expect(math.contains(null, { child: { a: 3, b: 4 } })).toBe(false);
        expect(math.contains({ child: { a: 5, b: 10 } }, null)).toBe(true);
    });

    it('inverse', () => {
        expect(math.inverse({ child: { a: 1, b: 2 } })).toEqual({ child: { a: -1, b: -2 } });
        expect(math.inverse({ child: { a: -1, b: 2 } })).toEqual({ child: { a: 1, b: -2 } });
        expect(math.inverse(null)).toEqual({ child: { a: -0, b: -0 } });
    });

    it('abs', () => {
        expect(math.abs({ child: { a: 1, b: 2 } })).toEqual({ child: { a: 1, b: 2 } });
        expect(math.abs({ child: { a: -1, b: 2 } })).toEqual({ child: { a: 1, b: 2 } });
        expect(math.abs(null)).toEqual(null);

        expect(math.abs({ child: { a: -1, b: 2 } }, 'zero')).toEqual({ child: { a: 0, b: 2 } });
        expect(math.abs({ child: { a: 1, b: -2 } }, 'zero')).toEqual({ child: { a: 1, b: 0 } });

        expect(math.abs({ child: { a: -1, b: 2 } }, 'remove')).toEqual({ child: { b: 2 } });
        expect(math.abs({ child: { a: 1, b: -2 } }, 'remove')).toEqual({ child: { a: 1 } });
    });

    it('round', () => {
        expect(math.round({ child: { a: 1.5, b: 2.5 } })).toEqual({ child: { a: 2, b: 3 } });
        expect(math.round({ child: { a: -1.5, b: 2.5 } })).toEqual({ child: { a: Math.round(-1.5), b: 3 } });
        expect(math.round(null)).toEqual(null);

        expect(math.round({ child: { a: 1.5, b: 2.5 } }, 'floor')).toEqual({ child: { a: 1, b: 2 } });
        expect(math.round({ child: { a: -1.5, b: 2.5 } }, 'floor')).toEqual({ child: { a: Math.floor(-1.5), b: 2 } });

        expect(math.round({ child: { a: 1.5, b: 2.5 } }, 'ceil')).toEqual({ child: { a: 2, b: 3 } });
        expect(math.round({ child: { a: -1.5, b: 2.5 } }, 'ceil')).toEqual({ child: { a: Math.ceil(-1.5), b: 3 } });
    });

    it('add', () => {
        expect(math.add({ child: { a: 1, b: 2 } }, { child: { a: 3, b: 4 } })).toEqual({ child: { a: 4, b: 6 } });
        expect(math.add(null, { child: { a: 3, b: 4 } })).toEqual({ child: { a: 3, b: 4 } });
        expect(math.add({ child: { a: 1, b: 2 } }, null)).toEqual({ child: { a: 1, b: 2 } });
        expect(math.add(null, null)).toEqual({ child: { a: 0, b: 0 } });
    });

    it('subtract', () => {
        expect(math.subtract({ child: { a: 5, b: 10 } }, { child: { a: 3, b: 4 } })).toEqual({ child: { a: 2, b: 6 } });
        expect(math.subtract({ child: { a: 5, b: 10 } }, { child: { a: 6, b: 4 } })).toEqual({ child: { a: -1, b: 6 } });
        expect(math.subtract(null, { child: { a: 3, b: 4 } })).toEqual({ child: { a: -3, b: -4 } });
        expect(math.subtract({ child: { a: 5, b: 10 } }, null)).toEqual({ child: { a: 5, b: 10 } });

        expect(math.subtract({ child: { a: 5, b: 10 } }, 2)).toEqual({ child: { a: 3, b: 8 } });
    });

    it('multiply', () => {
        expect(math.multiply({ child: { a: 2, b: 3 } }, { child: { a: 3, b: 4 } })).toEqual({ child: { a: 6, b: 12 } });
        expect(math.multiply({ child: { a: 2, b: 3 } }, 2)).toEqual({ child: { a: 4, b: 6 } });
        expect(math.multiply(null, { child: { a: 3, b: 4 } })).toEqual({ child: { a: 0, b: 0 } });
        expect(math.multiply({ child: { a: 2, b: 3 } }, null)).toEqual({ child: { a: 0, b: 0 } });
    });

    it('div', () => {
        // Division by object - returns minimum ratio
        expect(math.div({ child: { a: 4, b: 8 } }, { child: { a: 2, b: 4 } })).toBe(2);
        expect(math.div({ child: { a: 4, b: 8 } }, { child: { a: 2, b: 0 } })).toBe(2);
        expect(math.div({ child: { a: 0, b: 8 } }, { child: { a: 2, b: 4 } })).toBe(0);
        expect(math.div({ child: { a: 4, b: 8 } }, { child: { a: 0, b: 0 } })).toBe(0);
        expect(math.div(null, { child: { a: 2, b: 4 } })).toBe(0);
        expect(math.div({ child: { a: 4, b: 8 } }, null)).toBe(0);

        // Partial fields - only common keys are considered
        expect(math.div({ child: { a: 50 } }, { child: { a: 15 } })).toBe(3);
        expect(math.div({ child: { a: 50 } }, { child: { a: 20 } })).toBe(2);
        expect(math.div({ child: { a: 50 } }, { child: { b: 15 } })).toBe(0); // No common keys
        expect(math.div({ child: { a: 100, b: 20 } }, { child: { b: 10 } })).toBe(2);
        expect(math.div({ child: { a: 100 } }, { child: { a: 25, b: 10 } })).toBe(4);

        // Multiple overlapping keys - should find minimum ratio
        expect(math.div({ child: { a: 100, b: 30 } }, { child: { a: 10, b: 10 } })).toBe(3); // min(100/10, 30/10) = 3
        expect(math.div({ child: { a: 50, b: 100 } }, { child: { a: 25, b: 10 } })).toBe(2); // min(50/25, 100/10) = 2

        // Edge case: one object has zero in common key
        expect(math.div({ child: { a: 100, b: 0 } }, { child: { a: 10 } })).toBe(10);
        expect(math.div({ child: { a: 0, b: 100 } }, { child: { b: 10 } })).toBe(10);
        expect(math.div({ child: { a: 0, b: 100 } }, { child: { } })).toBe(0);

        // Division by scalar - divides each child field
        expect(math.div({ child: { a: 4, b: 8 } }, 2)).toEqual({ child: { a: 2, b: 4 } });
        expect(math.div({ child: { a: 10, b: 15 } }, 5)).toEqual({ child: { a: 2, b: 3 } });
        expect(math.div({ child: { a: 4, b: 8 } }, 0)).toEqual({ child: { a: 0, b: 0 } });
        expect(math.div(null, 2)).toEqual({ child: { a: 0, b: 0 } });
    });

    it('div with Infinity enabled', () => {
        const mathWithInfinity = new CompositeObjectMath<Struct>({ child: baseMath }).useInfinityOnDivByEmpty(true);

        // Division by null or empty should return Infinity when enabled
        expect(mathWithInfinity.div({ child: { a: 4, b: 8 } }, null)).toBe(Number.POSITIVE_INFINITY);
        expect(mathWithInfinity.div({ child: { a: 4, b: 8 } }, { child: { a: 0, b: 0 } })).toBe(Number.POSITIVE_INFINITY);
        expect(mathWithInfinity.div({ child: { a: 0, b: 100 } }, { child: { } })).toBe(Number.POSITIVE_INFINITY);

        // Normal divisions should still work
        expect(mathWithInfinity.div({ child: { a: 4, b: 8 } }, { child: { a: 2, b: 4 } })).toBe(2);
        expect(mathWithInfinity.div({ child: { a: 4, b: 8 } }, 2)).toEqual({ child: { a: 2, b: 4 } });
    });

    it('div with nested composite structures', () => {
        const math2 = new CompositeObjectMath<{ a: ChildStruct; b: ChildStruct }>({
            a: baseMath,
            b: baseMath,
        });

        // Scalar division on nested structure
        expect(math2.div(
            { a: { a: 10, b: 20 }, b: { a: 30, b: 40 } },
            5,
        )).toEqual({ a: { a: 2, b: 4 }, b: { a: 6, b: 8 } });

        // Object division returns minimum ratio across all nested fields
        expect(math2.div(
            { a: { a: 0, b: 0 }, b: { a: 10, b: 20 } },
            { a: { a: 1, b: 1 }, b: { a: 2, b: 4 } },
        )).toBe(0);
    });
});
