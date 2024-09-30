import { Comparator, Getter, Nullable, Predicate } from '../types';
import { random } from './calc';

/** type-safe `Array.isArray` wrapper  */
export function isArray<T>(value: any): value is T[] {
    return Array.isArray(value);
}

export function arrayCompareG<T>(arr: ReadonlyArray<T> | null | undefined, cond: (current: T, previous: T | null) => boolean): T | null {
    if (!isArray<T>(arr) || arr.length <= 0) {
        return null;
    }

    let result: T | null = null;
    for (let i = 0; i < arr.length; i++) {
        const current: T = arr[i];
        if (cond(current, result)) {
            result = current;
        }
    }

    return result;
}

export function arrayCompare(arr: ReadonlyArray<number> | null | undefined, absolute: boolean, cond: (i: number, t: number) => boolean) {
    if (!arr || !Array.isArray(arr) || arr.length <= 0) {
        return null;
    }

    const _arr = arr as ReadonlyArray<number>;
    let max = _arr[0];
    for (let i = 1; i < _arr.length; i++) {
        const e = absolute ? Math.abs(_arr[i]) : _arr[i];
        if (cond(e, max)) {
            max = e;
        }
    }

    return max;
}

export function arrayMax(arr: ReadonlyArray<number>, absolute = false) {
    return arrayCompare(arr, absolute, (e, max) => e > max);
}

export function arrayMin(arr: ReadonlyArray<number>, absolute = false) {
    return arrayCompare(arr, absolute, (e, min) => e < min);
}

export function arrayAverage(arr: ReadonlyArray<number> | null | undefined, absolute = false) {
    if (!Array.isArray(arr) || arr.length <= 0) {
        return 0;
    }

    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        const e = absolute ? Math.abs(arr[i]) : arr[i];
        sum += e;
    }

    return sum / arr.length;
}

export function arrayCount<T>(arr: ReadonlyArray<T> | null | undefined, condition: (o: T) => boolean): number {
    if (!arr || !arr.length) {
        return 0;
    }

    let count = 0;
    arr.forEach(a => {
        if (condition(a)) {
            ++count;
        }
    });
    return count;
}


type KeyOf<T> = {
    [K in keyof T]: T[K] extends string | number ? K : never;
}[(string & keyof T)];

/** @returns count of items in array per key, filtered off by predicate */
export function arrayCountByKey<T, TKey extends KeyOf<T>>(arr: ReadonlyArray<T>, key: TKey, predicate?: Predicate<T>): Record<string | number, number> {
    const result: Record<number, number> = {};
    for (let i = 0; i < arr.length; i += 1) {
        const item = arr[i];
        if (predicate && !predicate(item)) {
            continue;
        }

        const keyValue = item[key] as number;
        let count = result[keyValue];
        if (count == null) {
            count = 1;
        } else {
            count += 1;
        }

        result[keyValue] = count;
    }

    return result;
}

export function arrayFirstResult<T, V>(arr: ReadonlyArray<T> | null | undefined, mapper: (o: T) => V | null | false): V | null | false {
    if (arr?.length) {
        for (let i = 0; i < arr.length; ++i) {
            const r = mapper(arr[i]);
            if (r) {
                return r;
            }
        }
    }

    return false;
}

export function arraysCompare<T>(base: ReadonlyArray<T> | null | undefined, target: readonly T[], comparator?: Comparator<T>) {
    if (!base || !target) {
        return null;
    }

    const compare = comparator || Comparator.Default;
    const result = {
        missing: [] as T[],
        extra: [] as T[],
        diff: 0,
    };

    for (let i = 0; i < base.length; ++i) {
        const baseItem = base[i];
        const targetItem = target[i];
        if (compare(baseItem, targetItem)) {
            continue;
        }

        result.missing.push(baseItem);
    }

    for (let i = base.length; i < target.length; ++i) {
        result.extra.push(target[i]);
    }

    result.diff = result.missing.length + result.extra.length;
    return result;
}

export function arraysCompareDistinct<T>(base: ReadonlyArray<T> | null | undefined, target: ReadonlyArray<T> | null | undefined) {
    if (!base || !target) {
        return null;
    }

    const baseSet = new Set(base);
    const targetSet = new Set(target);
    const result = {
        missing: [] as T[],
        extra: [] as T[],
        diff: 0,
    };

    for (const item of baseSet) {
        if (!targetSet.has(item)) {
            result.missing.push(item);
        } else {
            // reduce iterations for 'extra'
            targetSet.delete(item);
        }
    }

    for (const item of targetSet) {
        // all items left in 'target' is missing in 'base'
        result.extra.push(item);
    }

    result.diff = result.missing.length + result.extra.length;
    return result;
}

export function arrayDistinct<T>(arr: ReadonlyArray<T> | null | undefined): T[] {
    return Array.from(new Set(arr || []));
}

export function normalize(arr: number[]): number[] {
    if (arr.length === 0) {
        return arr;
    }

    const min = arrayMin(arr);
    const max = arrayMax(arr);
    if (min == null || max == null) {
        return arr;
    }

    const dist = max - min;
    if (Math.abs(dist) < 0.000001) { // almost zero
        return arr.map(() => 1);
    }

    return arr.map(x => (x - min) / dist);
}

export function randomArrayItem<T>(arr: ReadonlyArray<T>): T | null {
    if (!arr.length) {
        return null;
    }

    const i = random(0, arr.length - 1);
    return arr[i];
}

export function arraySwap<T>(arr: T[], i1: number, i2: number) {
    const x = arr[i1];
    arr[i1] = arr[i2];
    arr[i2] = x;
}

export function shuffle<T>(arr: null | undefined, slice: any): T[];
export function shuffle<T>(arr: T[], slice: false): T[];
export function shuffle<T>(arr: Nullable<ReadonlyArray<T>>): T[];
export function shuffle<T>(arr: Nullable<ReadonlyArray<T>>, slice: true): T[];

export function shuffle<T>(arr: Nullable<T[] | ReadonlyArray<T>>, slice = true): T[] {
    const res: T[] = ((slice || !arr || !('push' in arr)) ? arr?.slice() : arr) || [];

    for (let i = 0; i < res.length; ++i) {
        const nextIndex = random(i, res.length - 1);
        arraySwap(res, i, nextIndex);
    }

    return res;
}

export function groupBy<T, K extends string | number>(arr: ReadonlyArray<T>, grouper: (item: T) => K): Partial<Record<K, T[]>> {
    const result: Partial<Record<K, T[]>> = { };
    arr.forEach(item => {
        const k = grouper(item);
        let g = result[k];
        if (!g) {
            g = [];
            result[k] = g;
        }

        g.push(item);
    });

    return result;
}

export function groupOneBy<T, K extends string | number>(arr: ReadonlyArray<T>, grouper: (item: T) => K): Partial<Record<K, T>> {
    const result: Partial<Record<K, T>> = { };
    arr.forEach(item => {
        const k = grouper(item);
        result[k] = item;
    });

    return result;
}

export function arraySplit<T>(arr: ReadonlyArray<T>, predicate: (t: T) => boolean): [T[], T[]] {
    const trueArr: T[] = [];
    const falseArr: T[] = [];

    arr.forEach(a => {
        (predicate(a)
            ? trueArr
            : falseArr).push(a);
    });

    return [trueArr, falseArr];
}

export function findIndexLeast(num: number, arr: number[], sort = false) {
    if (sort) {
        arr.sort();
    }

    return arr.findIndex(i => i > num);
}

export function findLastIndex<T>(arr: Nullable<ReadonlyArray<T>>, predicate: Predicate<T>) {
    if (!arr?.length) {
        return -1;
    }

    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) {
            return i;
        }
    }

    return -1;
}

export function findLast<T>(arr: Nullable<ReadonlyArray<T>>, predicate: Predicate<T>) {
    const i = findLastIndex(arr, predicate);
    return i >= 0 ? arr![i] : null;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- anything for which `typeof` will be 'function'
type NonFunction<T> = T extends Function ? never : T;

export function removeItem<T>(array: T[], item: NonFunction<T> | Predicate<T>): T | null {
    const index = typeof item === 'function'
        ? array.findIndex(item as Predicate<T>)
        : array.indexOf(item);
    if (index < 0) {
        return null;
    }

    return array.splice(index, 1)[0];
}

export function arrayRepeat<T>(factory: Getter<T>, count = 1) {
    const res: T[] = [];
    for (let i = 0; i < count; ++i) {
        res.push(Getter.getValue(factory));
    }
    return res;
}

export function chunkify<T>(array: T[], size: number): T[][] {
    return array.reduce((res, item) => {
        let arr = res[res.length - 1];
        if (!arr || arr.length >= size) {
            arr = [];
            res.push(arr);
        }

        arr.push(item);
        return res;
    }, [] as T[][]);
}
