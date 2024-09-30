import { nameof } from '../nameof';

describe('nameof', () => {

    it('works w/ obj arg', () => {
        const obj = { a: { b: { c: 123 } } };

        expect(nameof(obj, 'a')).toBe('a');
    });

    it('works w/o obj arg', () => {
        const _obj = { a: { b: { c: 123 } } };

        expect(nameof<typeof _obj>('a')).toBe('a');
    });

    describe('full', () => {
        it('parses inner fields 1', () => {
            const obj = { a: { b: { c: 123 } } };
            expect(nameof.full(obj).key('a').result).toBe('a');
        });

        it('parses inner fields 2', () => {
            const obj = { a: { b: { c: 123 } } };
            expect(nameof.full(obj).key('a').key('b').result).toBe('a.b');

            class Inner {
                field: string = '';
            }

            class Outer {
                inner: Inner = new Inner();
            }

            expect(nameof.full<Outer>().key('inner').result).toBe('inner');
            expect(nameof.full<Outer>().key('inner').key('field').result).toBe('inner.field');
        });

        it('parses inner fields 3', () => {
            const obj = { a: { b: { c: 123 } } };
            expect(nameof.full(obj).key('a').key('b').key('c').result).toBe('a.b.c');
        });

        it('parses inner fields 4', () => {
            const obj = { a: { b: { c: 123 } } };
            expect(nameof.full(obj).key('a').key('b').key('c').key('toLocaleString').result).toBe('a.b.c.toLocaleString');
        });
    });
});
