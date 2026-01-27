import { CompositeObjectOps } from '../ops.composite.js';
import { ObjectOps } from '../ops.js';
import { describe, expect, it } from 'vitest';

describe('math/object/ops.composite', () => {
    type ChildStruct = { a?: number; b?: number };
    type Struct = { child?: ChildStruct };

    const childOps = new ObjectOps<ChildStruct>(['a', 'b']);
    const ops = new CompositeObjectOps<Struct>({ child: childOps });

    it('getEmpty', () => {
        const empty = ops.getEmpty();
        expect(empty).toEqual({ child: { a: 0, b: 0 } });
        expect(ops.Empty).toEqual({ child: { a: 0, b: 0 } });
    });

    it('isEmpty', () => {
        expect(ops.isEmpty(null)).toBe(true);
        expect(ops.isEmpty(undefined)).toBe(true);
        expect(ops.isEmpty({} as Struct)).toBe(true);
        expect(ops.isEmpty({ child: {} as ChildStruct })).toBe(true);
        expect(ops.isEmpty({ child: { a: 0, b: 0 } })).toBe(true);
        expect(ops.isEmpty({ child: { a: 1, b: 0 } })).toBe(false);
        expect(ops.isEmpty({ child: { a: 0, b: 1 } })).toBe(false);
        expect(ops.isEmpty({ child: { a: 1, b: 2 } })).toBe(false);
    });

    it('clone', () => {
        expect(ops.clone(null)).toEqual({ child: { a: 0, b: 0 } });
        expect(ops.clone(undefined)).toEqual({ child: { a: 0, b: 0 } });
        expect(ops.clone({} as Struct)).toEqual({ child: { a: 0, b: 0 } });
        expect(ops.clone({ child: { a: 1, b: 2 } })).toEqual({ child: { a: 1, b: 2 } });
        expect(ops.clone({ child: { a: 1, b: undefined! as number } })).toEqual({ child: { a: 1, b: 0 } });
        expect(ops.clone({ child: { a: null! as number, b: 123 } })).toEqual({ child: { a: 0, b: 123 } });

        // Verify it creates a new object
        const original = { child: { a: 1, b: 2 } };
        const cloned = ops.clone(original);
        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.child).not.toBe(original.child);
    });

    it('isValid', () => {
        expect(ops.isValid(null)).toBe(false);
        expect(ops.isValid(undefined)).toBe(false);
        expect(ops.isValid({} as Struct)).toBe(false);
        expect(ops.isValid({ child: { a: 0, b: 0 } })).toBe(false);

        childOps.addValidator(o => (o.a ?? 0) >= 0 && (o.b ?? 0) >= 0);

        expect(ops.isValid({ child: { a: 1, b: 2 } })).toBe(true);
        expect(ops.isValid({ child: { a: -1, b: 2 } })).toBe(false);
        expect(ops.isValid({ child: { a: 1, b: -2 } })).toBe(false);
        expect(ops.isValid({ child: { a: -1, b: -2 } })).toBe(false);
    });

    it('isEquals', () => {
        expect(ops.isEquals(null, null)).toBe(true);
        expect(ops.isEquals(undefined, undefined)).toBe(true);
        expect(ops.isEquals(null, undefined)).toBe(true);
        expect(ops.isEquals(null, {} as Struct)).toBe(false);
        expect(ops.isEquals({} as Struct, null)).toBe(false);

        expect(ops.isEquals(
            { child: { a: 1, b: 2 } },
            { child: { a: 1, b: 2 } },
        )).toBe(true);

        expect(ops.isEquals(
            { child: { a: 1, b: 2 } },
            { child: { a: 1, b: 3 } },
        )).toBe(false);

        expect(ops.isEquals(
            { child: { a: 1, b: 2 } },
            { child: { a: 2, b: 2 } },
        )).toBe(false);

        // Extra properties don't affect equality for tracked keys
        expect(ops.isEquals(
            { child: { a: 1, b: 2 }, extra: 'test' } as unknown as Struct,
            { child: { a: 1, b: 2 } },
        )).toBe(true);
    });

    it('assign', () => {
        const target: Struct = { child: { a: 1, b: 2 } };
        ops.assign(target, { child: { a: 3, b: 4 } });
        expect(target).toEqual({ child: { a: 3, b: 4 } });

        // Assign from null - will assign null to child (not skip it)
        const target2: Struct = { child: { a: 5, b: 6 } };
        ops.assign(target2, null);
        expect(target2).toEqual({ child: null });

        // Assign undefined child - should not change anything
        const target2b: Struct = { child: { a: 5, b: 6 } };
        ops.assign(target2b, {} as Struct);
        expect(target2b).toEqual({ child: { a: 5, b: 6 } });

        // Assign partial values
        const target3: Struct = { child: { a: 10, b: 20 } };
        ops.assign(target3, { child: { b: 30 } });
        expect(target3).toEqual({ child: { b: 30 } });
    });

    it('nested composite structures', () => {
        type NestedStruct = { a: ChildStruct; b: ChildStruct };
        const nestedOps = new CompositeObjectOps<NestedStruct>({
            a: childOps,
            b: childOps,
        });

        // getEmpty
        expect(nestedOps.getEmpty()).toEqual({
            a: { a: 0, b: 0 },
            b: { a: 0, b: 0 },
        });

        // isEmpty
        expect(nestedOps.isEmpty(null)).toBe(true);
        expect(nestedOps.isEmpty({ a: { a: 0, b: 0 }, b: { a: 0, b: 0 } })).toBe(true);
        expect(nestedOps.isEmpty({ a: { a: 1, b: 0 }, b: { a: 0, b: 0 } })).toBe(false);
        expect(nestedOps.isEmpty({ a: { a: 0, b: 0 }, b: { a: 0, b: 1 } })).toBe(false);

        // clone
        const nestedOriginal = { a: { a: 1, b: 2 }, b: { a: 3, b: 4 } };
        const nestedCloned = nestedOps.clone(nestedOriginal);
        expect(nestedCloned).toEqual(nestedOriginal);
        expect(nestedCloned).not.toBe(nestedOriginal);
        expect(nestedCloned.a).not.toBe(nestedOriginal.a);
        expect(nestedCloned.b).not.toBe(nestedOriginal.b);

        // isEquals
        expect(nestedOps.isEquals(
            { a: { a: 1, b: 2 }, b: { a: 3, b: 4 } },
            { a: { a: 1, b: 2 }, b: { a: 3, b: 4 } },
        )).toBe(true);

        expect(nestedOps.isEquals(
            { a: { a: 1, b: 2 }, b: { a: 3, b: 4 } },
            { a: { a: 1, b: 2 }, b: { a: 3, b: 5 } },
        )).toBe(false);

        // assign
        const nestedTarget: NestedStruct = { a: { a: 1, b: 2 }, b: { a: 3, b: 4 } };
        nestedOps.assign(nestedTarget, { a: { a: 10, b: 20 }, b: { a: 30, b: 40 } });
        expect(nestedTarget).toEqual({ a: { a: 10, b: 20 }, b: { a: 30, b: 40 } });
    });

    it('mixed empty and non-empty children', () => {
        type MixedStruct = { x: ChildStruct; y: ChildStruct };
        const mixedOps = new CompositeObjectOps<MixedStruct>({
            x: childOps,
            y: childOps,
        });

        // Only considered empty if ALL children are empty
        expect(mixedOps.isEmpty({ x: { a: 1, b: 2 }, y: { a: 0, b: 0 } })).toBe(false);
        expect(mixedOps.isEmpty({ x: { a: 0, b: 0 }, y: { a: 1, b: 2 } })).toBe(false);
        expect(mixedOps.isEmpty({ x: { a: 0, b: 0 }, y: { a: 0, b: 0 } })).toBe(true);
    });
});
