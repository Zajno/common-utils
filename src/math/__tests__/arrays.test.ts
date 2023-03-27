import * as arrays from '../arrays';

describe('math/arrays', () => {
    it('arrayCompareG', () => {
        expect(arrays.arrayCompareG<any>(null, null)).toBeNull();
        expect(arrays.arrayCompareG<any>([], null)).toBeNull();

        type T = { a: number };
        const tArr: T[] = [ { a: 1 }, { a: 2 }, { a: 3 } ];
        expect(arrays.arrayCompareG<T>(tArr, (t, p) => !p || t.a > p.a))
            .toEqual({ a: 3 });
    });

    it('arrayCompare', () => {
        expect(arrays.arrayCompare(null, false, null)).toBeNull();
        expect(arrays.arrayCompare([], false, null)).toBeNull();

        expect(() => arrays.arrayCompare([1, 2, 3], false, null)).toThrow();

        expect(arrays.arrayCompare([1, 2, 3], false, (i, t) => i > t)).toBe(3);
        expect(arrays.arrayCompare([1, 2, 3], false, (i, t) => i < t)).toBe(1);

        expect(arrays.arrayCompare([-1, 2, -3], true, (i, t) => i > t)).toBe(3);
        expect(arrays.arrayCompare([-1, 2, -3], true, (i, t) => i < t)).toBe(-1);
    });

    it('arrayMax', () => {
        expect(arrays.arrayMax([], false)).toBeNull();
        expect(arrays.arrayMax([1, 2, 3], false)).toBe(3);
        expect(arrays.arrayMax([-1, 2, -3], true)).toBe(3);
    });

    it('arrayMin', () => {
        expect(arrays.arrayMin([], false)).toBeNull();
        expect(arrays.arrayMin([1, 2, 3], false)).toBe(1);
        expect(arrays.arrayMin([-1, 2, -3], true)).toBe(-1);
    });

    it('arrayAverage', () => {
        expect(arrays.arrayAverage(null)).toBe(0);
        expect(arrays.arrayAverage([])).toBe(0);
        expect(arrays.arrayAverage([1, 2, 3])).toBe(2);
        expect(arrays.arrayAverage([-2, 2, -3])).toBe(-1);
        expect(arrays.arrayAverage([-1, 2, -3], true)).toBe(2);
    });

    it('arrayCount', () => {
        expect(arrays.arrayCount(null, null)).toBe(0);
        expect(arrays.arrayCount([], null)).toBe(0);

        expect(() => arrays.arrayCount([1, 2, 3], null)).toThrow();
        expect(arrays.arrayCount([1, 2, 3], i => i >= 2)).toBe(2);

        type T = { a: number };
        const tArr: T[] = [ { a: 1 }, { a: 2 }, { a: 3 } ];
        expect(arrays.arrayCount(tArr, i => i.a >= 2)).toBe(2);
    });

    it('arrayFirstResult', () => {
        expect(arrays.arrayFirstResult(null, null)).toBeFalsy();
        expect(arrays.arrayFirstResult([], null)).toBeFalsy();

        expect(() => arrays.arrayFirstResult([1, 2, 3], null)).toThrow();
        expect(arrays.arrayFirstResult([1, 2, 3], i => i == 2 ? 'pass' : false)).toBe('pass');
    });

    it('arraysCompare', () => {
        expect(arrays.arraysCompare(null, null)).toBeNull();
        expect(arrays.arraysCompare([], null)).toBeNull();

        const result = (missing, extra, diff) => ({ missing, extra, diff });

        expect(arrays.arraysCompare([], [])).toStrictEqual(result([], [], 0));
        expect(arrays.arraysCompare([1], [])).toStrictEqual(result([1], [], 1));
        expect(arrays.arraysCompare([1, 2], [1])).toStrictEqual(result([2], [], 1));
        expect(arrays.arraysCompare([1], [1])).toStrictEqual(result([], [], 0));
        expect(arrays.arraysCompare([], [1])).toStrictEqual(result([], [1], 1));
        expect(arrays.arraysCompare([1, 2, 3], [3, 2, 1])).toStrictEqual(result([1, 3], [], 2));
    });

    it('arraysCompareDistinct', () => {
        expect(arrays.arraysCompareDistinct(null, null)).toBeNull();
        expect(arrays.arraysCompareDistinct([], null)).toBeNull();

        const result = (missing, extra, diff) => ({ missing, extra, diff });

        expect(arrays.arraysCompareDistinct([], [])).toStrictEqual(result([], [], 0));
        expect(arrays.arraysCompareDistinct([1], [])).toStrictEqual(result([1], [], 1));
        expect(arrays.arraysCompareDistinct([1, 2], [1])).toStrictEqual(result([2], [], 1));
        expect(arrays.arraysCompareDistinct([1], [1])).toStrictEqual(result([], [], 0));
        expect(arrays.arraysCompareDistinct([], [1])).toStrictEqual(result([], [1], 1));
        expect(arrays.arraysCompareDistinct([1, 2], [2, 1, 1])).toStrictEqual(result([], [], 0));
        expect(arrays.arraysCompareDistinct([1, 2, 3], [3, 2, 1])).toStrictEqual(result([], [], 0));
    });

    it('arrayDistinct', () => {
        expect(arrays.arrayDistinct(null)).toStrictEqual([]);
        expect(arrays.arrayDistinct([])).toStrictEqual([]);
        expect(arrays.arrayDistinct([1])).toStrictEqual([1]);
        expect(arrays.arrayDistinct([1, 2, 3])).toStrictEqual([1, 2, 3]);
        expect(arrays.arrayDistinct([1, '2', 3])).toStrictEqual([1, '2', 3]);
        expect(arrays.arrayDistinct([1, 1, 1])).toStrictEqual([1]);
        expect(arrays.arrayDistinct(['1', '1', '1'])).toStrictEqual(['1']);
    });

    it('normalize', () => {
        expect(arrays.normalize([])).toHaveLength(0);

        expect(arrays.normalize([10, 10])).toEqual([1, 1]);
        expect(arrays.normalize([1, 2, 3])).toEqual([0, 0.5, 1]);
    });

    it('randomArrayItem', () => {
        expect(() => arrays.randomArrayItem(null)).toThrow();
        expect(arrays.randomArrayItem([])).toBeNull();

        expect(arrays.randomArrayItem([1])).toBe(1);
        expect([1, 2, 3]).toContain(arrays.randomArrayItem([1, 2, 3]));

        const arr1 = [1, 2, 3], arr2 = arr1.slice();
        arrays.arraySwap(arr2, 0, 2);
        expect(arr2[0]).toEqual(arr1[2]);
        expect(arr2[2]).toEqual(arr1[0]);
    });

    it('shuffle', () => {
        expect(arrays.shuffle(null)).toStrictEqual([]);
        expect(arrays.shuffle(null, true)).toStrictEqual([]);

        const arr1 = [1, 2, 3], arr2 = arr1.slice();
        arrays.shuffle(arr2);
        arrays.shuffle(arr2, true);
        expect(arr2).toHaveLength(arr1.length);
        arr2.forEach(i => {
            expect(arr1).toContain(i);
        });
    });

    it('groupBy', () => {
        expect(() => arrays.groupBy(null, null)).toThrow();

        type T = { a: number };
        const tArr: T[] = [ { a: 1 }, { a: 2 }, { a: 2 }, { a: 3 } ];
        const result = arrays.groupBy(tArr, i => i.a);
        expect(result).toBeTruthy();

        expect(result[1]).toHaveLength(1);
        expect(result[1][0]).toEqual({ a: 1 });

        expect(result[2]).toHaveLength(2);
        expect(result[2][0]).toEqual({ a: 2 });

        expect(result[3]).toHaveLength(1);
        expect(result[3][0]).toEqual({ a: 3 });
    });

    it('groupOneBy', () => {
        expect(() => arrays.groupOneBy(null, null)).toThrow();

        const result = arrays.groupOneBy([ { a: 1 }, { a: 2 }, { a: 2 }, { a: 3 } ], i => i.a);
        expect(result).toBeTruthy();

        expect(result[1]).toEqual({ a: 1 });
        expect(result[2]).toEqual({ a: 2 });
        expect(result[3]).toEqual({ a: 3 });
    });

    it('arraySplit', () => {
        expect(() => arrays.arraySplit(null, null)).toThrow();

        const result = arrays.arraySplit([ { a: 1 }, { a: 2 }, { a: 2 }, { a: 3 } ], i => i.a >= 2);
        expect(result).toBeTruthy();

        expect(result[0]).toHaveLength(3);
        expect(result[1]).toHaveLength(1);
    });

    it('findIndexLeast', () => {
        expect(() => arrays.findIndexLeast(0, null)).toThrow();

        expect(arrays.findIndexLeast(2, [3, 2, 1])).toBe(0);
        expect(arrays.findIndexLeast(2, [3, 2, 1], true)).toBe(2);
        expect(arrays.findIndexLeast(2, [1, 2, 3])).toBe(2);
    });

    it('removeItem', () => {
        const check = (input: any[], remove: any, output: any[]) => {
            arrays.removeItem(input, remove);
            expect(input).toStrictEqual(output);
        };

        check([1, 2, 3], 1, [2, 3]);
        check([1, 2, 3], item => item === 1, [2, 3]);
        check([1, 2, 3], '1', [1, 2, 3]);
    });
});
