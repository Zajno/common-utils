import { updateArray } from '../update.js';

describe('fields/update', () => {
    it('empty input', () => {
        expect(updateArray(null, null)).toStrictEqual({ changed: 0, result: null });
    });

    it('updates primitives | numbers', () => {
        const target = [1, 5, 3];
        const source = [4, 3, 2];

        const results1 = updateArray(target, source, { clone: true });
        expect(results1.changed).toBe(4);
        expect(results1.result).toStrictEqual([2, 3, 4]);

        const results2 = updateArray(target, source, { sorter: null });
        expect(results2.changed).toBe(4);
        expect(results2.result).toStrictEqual([3, 4, 2]);
    });

    it('updates primitives | strings', () => {
        const target = ['a', 'b', 'c'];
        const source = ['b', 'c', 'd'];

        const results = updateArray(target, source);

        expect(results.changed).toBe(2);
        expect(results.result).toStrictEqual(source);
    });

    describe('updates objects', () => {
        it('no options', () => {
            const res = updateArray([
                { id: 1, v: 'a' },
                { id: 5, v: 'e' },
                { id: 3, v: 'c' },
            ], [
                { id: 2, v: 'b' },
            ]);

            expect(res.changed).toBe(4);
            expect(res.result).toStrictEqual([
                { id: 2, v: 'b' },
            ]);
        });

        it('full options', () => {
            const res = updateArray([
                { id: 1, v: 'a' },
                { id: 5, v: 'e' },
                { id: 3, v: 'c' },
            ], [
                { id: 2, v: 'b' },
                { id: 1, v: '1K' },
            ], {
                clone: true,
                comparator: (v1, v2) => v1.id === v2.id,
                updater: (t, s) => {
                    t.v = s.v + '_' + t.id;
                    return t;
                },
                sorter: (v1, v2) => v1.id - v2.id,
            });

            expect(res.changed).toBe(3);
            expect(res.result).toStrictEqual([
                { id: 1, v: '1K_1' },
                { id: 2, v: 'b' },
            ]);
        });
    });
});
