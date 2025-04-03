import { extractChangedFields, hasChangedFields, transferFields } from '../transfer.js';

describe('fields/transfer', () => {

    it('base', () => {
        const source = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
        };
        const destination: Partial<typeof source> = { };

        expect(transferFields(
            source,
            (_, v) => v > 2,
            destination,
            'a', 'b', 'c', 'd',
        )).toBe(2);

        expect(destination).toEqual({ c: 3, d: 4 });
    });

    it('presets', () => {
        const source = { a: null, b: 2, c: false, d: 'text', e: undefined, f: true };
        const fields = Object.keys(source) as (keyof typeof source)[];

        const d1: Partial<typeof source> = { };
        expect(transferFields.truthy(source, d1, ...fields)).toBe(3);
        expect(d1).toEqual({ b: 2, d: 'text', f: true });

        const d2: Partial<typeof source> = { };
        expect(transferFields.notNull(source, d2, ...fields)).toBe(4);
        expect(d2).toEqual({ b: 2, c: false, d: 'text', f: true });

        const d3: Partial<typeof source> = { };
        expect(transferFields.defined(source, d3, ...fields)).toBe(5);
        expect(d3).toEqual({ a: null, b: 2, c: false, d: 'text', f: true });

        const d4: Partial<typeof source> = { };
        const compare4: typeof source = { a: 1 as unknown as null, b: 3, c: true, d: 'text2', e: 0 as unknown as undefined, f: false };
        expect(transferFields.changed(source, compare4, d4, ...fields)).toBe(5);
        expect(d4).toEqual(source); // all fields changed
    });

    it('hasChangedFields', () => {
        const source = { a: null, b: 2, c: false, d: 'text', e: undefined, f: true };
        const compare = { a: 1 as unknown as null, b: 3, c: true, d: 'text2', e: 0 as unknown as undefined, f: false };
        const fields = Object.keys(source) as (keyof typeof source)[];

        expect(hasChangedFields(source, compare, ...fields)).toBe(true);
        expect(hasChangedFields(source, source, ...fields)).toBe(false);
        expect(hasChangedFields(source, { ...source, b: 3 }, ...fields)).toBe(true);
    });

    it('extractChangedFields', () => {
        const source = { a: null, b: 2, c: false, d: 'text', e: undefined, f: true };
        const compare = { a: 1 as unknown as null, b: 3, c: true, d: 'text2', e: 0 as unknown as undefined, f: false };
        const fields = Object.keys(source) as (keyof typeof source)[];

        // undefined fields are ignored
        expect(extractChangedFields(source, compare, ...fields)).toEqual({
            transferred: 5,
            result: {
                a: null,
                b: 2,
                c: false,
                d: 'text',
                f: true,
            },
        });
        expect(extractChangedFields(source, source, ...fields)).toEqual({
            transferred: 0,
            result: {},
        });
        expect(extractChangedFields(source, { ...source, b: 3 }, ...fields)).toEqual({
            transferred: 1,
            result: {
                b: 2,
            },
        });
    });
});
