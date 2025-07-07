import type { StringKeys } from '../../../types/misc.js';
import { ObjectOps } from '../ops.js';
import type { NumKey } from '../types.js';

type Struct = {
    a: number;
    b: number;
};

type StructExtra = Struct &{
    c: string;
};

type StructOptional = Partial<StructExtra>;

describe('math/object/ops', () => {

    describe('NumKey type', () => {

        const fn = (key: 'a' | 'b') => { return key; };

        it('simple', () => {
            type StructKey = StringKeys<StructOptional>;
            type StructNumKey = NumKey<StructExtra>;

            // no error
            const key1: StructNumKey = 'a';
            expect(fn(key1)).toBe(key1);

            const keyBase: StructKey = 'a';
            // no error
            expect(fn(keyBase)).toBe(keyBase);

            // @ts-expect-error key 'c' is not a number key
            expect(fn('c')).toBe('c');
        });

        it('partial', () => {
            type Test = NumKey<StructOptional>;

            // no error
            const testKey: Test = 'a';

            // no error
            expect(fn(testKey)).toBe(testKey);

            // @ts-expect-error key 'c' is not a number key
            expect(fn('c')).toBe('c');
        });
    });


    it('keys type', () => {
        // @ts-expect-error key 'c' is not a number key
        const ops = new ObjectOps<StructExtra>(['a', 'b', 'c']);
        expect(ops.keys).toEqual(['a', 'b', 'c']);
    });

    it('functions', () => {
        const ops = new ObjectOps<Struct>(['a', 'b']);

        const empty = ops.getEmpty();
        expect(empty).toEqual({ a: 0, b: 0 });

        expect(ops.isEmpty(null)).toBe(true);
        expect(ops.isEmpty(undefined)).toBe(true);
        expect(ops.isEmpty({} as Struct)).toBe(true);
        expect(ops.isEmpty(empty)).toBe(true);
        expect(ops.isEmpty({ a: 0, b: 0 })).toBe(true);
        expect(ops.isEmpty({ a: 1, b: 0 })).toBe(false);

        expect(ops.clone(null)).toEqual(empty);
        expect(ops.clone(undefined)).toEqual(empty);
        expect(ops.clone({} as Struct)).toEqual(empty);
        expect(ops.clone({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
        expect(ops.clone({ a: 1, b: undefined! as number })).toEqual({ a: 1, b: 0 });
        expect(ops.clone({ a: null! as number, b: 123 })).toEqual({ a: 0, b: 123 });

        expect(ops.isValid(null)).toBe(false);
        expect(ops.isValid(undefined)).toBe(false);
        expect(ops.isValid({} as Struct)).toBe(false);
        expect(ops.isValid(empty)).toBe(false);

        ops.addValidator(o => o.a >= 0 && o.b >= 0);
        expect(ops.isValid({ a: 1, b: 2 })).toBe(true);
        expect(ops.isValid({ a: -1, b: 2 })).toBe(false);
        expect(ops.isValid({ a: 1, b: -2 })).toBe(false);
        expect(ops.isValid({ a: -1, b: -2 })).toBe(false);

        // isEquals
        expect(ops.isEquals(null, null)).toBe(true);
        expect(ops.isEquals(undefined, undefined)).toBe(true);
        expect(ops.isEquals(null, undefined)).toBe(true);
        expect(ops.isEquals(null, {} as Struct)).toBe(false);
        expect(ops.isEquals({} as Struct, null)).toBe(false);
        expect(ops.isEquals({} as Struct, {} as Struct)).toBe(true);
        expect(ops.isEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
        expect(ops.isEquals({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
        expect(ops.isEquals({ a: 1, b: 2 }, { a: 2, b: 2 })).toBe(false);
        expect(ops.isEquals({ a: 1, b: 2 }, { a: 1, b: 2, c: 'test' } as Struct)).toBe(true);
        expect(ops.isEquals({ a: 1, b: 2, c: 'test' } as Struct, { a: 1, b: 2 })).toBe(true);

        // strip: false/null
        expect(ops.strip({ a: 1, b: 2, c: 'test' } as Struct)).toEqual({ a: 1, b: 2 });
        expect(ops.strip({ a: 1, b: null! as number }, false)).toEqual({ a: 1, b: null });
        expect(ops.strip({ a: 1, b: undefined! as number }, false)).toEqual({ a: 1, b: undefined });
        expect(ops.strip({ a: 1, b: null! as number }, 'null')).toEqual({ a: 1 });
        expect(ops.strip({ a: 1, b: undefined! as number }, 'null')).toEqual({ a: 1 });

        expect(ops.strip({ a: 123, b: 456 }, (k, v) => v != null && v % 2 === 0)).toEqual({ a: 123 });

        // strip: true
        expect(ops.strip({ a: 1, b: 2 }, true)).toEqual({ a: 1, b: 2 });
        expect(ops.strip({ a: 1, b: null! as number }, true)).toEqual({ a: 1 });
        expect(ops.strip({ a: 1, b: undefined! as number }, true)).toEqual({ a: 1 });
        expect(ops.strip({ a: 1, b: 0 }, true)).toEqual({ a: 1 });

        // strip: falsy
        expect(ops.strip({ a: 1, b: null! as number }, 'falsy')).toEqual({ a: 1 });
        expect(ops.strip({ a: 1, b: undefined! as number }, 'falsy')).toEqual({ a: 1 });
        expect(ops.strip({ a: 1, b: 0 }, 'falsy')).toEqual({ a: 1 });

        // toStringData
        expect(ops.toStringData(null, { a: 'A', b: 'B' })).toEqual([]);
        expect(ops.toStringData(
            { a: 1, b: 0, c: 'test' } as Struct,
            { a: 'A', b: 'B' },
            true,
        )).toEqual([
            [1, 'A'],
        ]);

        // assign
        expect(ops.assign({ a: 1, b: 2 }, { b: 3, c: 4 } as unknown as Struct)).toEqual({ a: 1, b: 3 });
    });
});
