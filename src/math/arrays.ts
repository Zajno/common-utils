import { Comparator, Predicate } from '../types';
import { random } from './calc';

export function arrayCompareG<T>(arr: ReadonlyArray<T>, cond: (current: T, previous: T) => boolean): T {
    if (!Array.isArray(arr) || arr.length <= 0) {
        return null;
    }

    let result: T = null;
    for (let i = 0; i < arr.length; i++) {
        const current: T = arr[i];
        if (cond(current, result)) {
            result = current;
        }
    }

    return result;
}

export function arrayCompare(arr: number[], absolute: boolean, cond: (i: number, t: number) => boolean) {
    if (!Array.isArray(arr) || arr.length <= 0) {
        return null;
    }

    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        const e = absolute ? Math.abs(arr[i]) : arr[i];
        if (cond(e, max)) {
            max = e;
        }
    }

    return max;
}

export function arrayMax(arr: number[], absolute = false) {
    return arrayCompare(arr, absolute, (e, max) => e > max);
}

export function arrayMin(arr: number[], absolute = false) {
    return arrayCompare(arr, absolute, (e, min) => e < min);
}

export function arrayAverage(arr: number[], absolute = false) {
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

export function arrayCount<T>(arr: ReadonlyArray<T>, condition: (o: T) => boolean): number {
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

export function arrayFirstResult<T, V>(arr: ReadonlyArray<T>, mapper: (o: T) => V | null | false): V | null | false {
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

export function arraysCompare<T>(base: readonly T[], target: readonly T[], comparator?: Comparator<T>) {
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

export function arraysCompareDistinct<T>(base: readonly T[], target: readonly T[]) {
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

export function arrayDistinct<T>(arr: readonly T[]) {
    return Array.from(new Set(arr || []));
}

export function normalize(arr: number[]): number[] {
    if (arr.length === 0) {
        return arr;
    }

    const min = arrayMin(arr);
    const max = arrayMax(arr);
    const dist = max - min;
    if (Math.abs(dist) < 0.000001) { // almost zero
        return arr.map(() => 1);
    }

    return arr.map(x => (x - min) / dist);
}

export function randomArrayItem<T>(arr: T[]): T {
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

export function shuffle<T>(arr: T[], slice: false): T[];
export function shuffle<T>(arr: ReadonlyArray<T>): T[];
export function shuffle<T>(arr: ReadonlyArray<T>, slice: true): T[];

export function shuffle<T>(arr: T[], slice = true): T[] {
    const res = (slice ? arr?.slice() : arr) || [];

    for (let i = 0; i < res.length - 1; ++i) {
        const nextIndex = random(i + 1, res.length - 1);
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

type NonFunction<T> = T extends Function ? never : T;

export function removeItem<T>(array: T[], item: NonFunction<T> | Predicate<T>): T {
    const index = typeof item === 'function'
        ? array.findIndex(item as Predicate<T>)
        : array.indexOf(item);
    if (index < 0) {
        return null;
    }

    return array.splice(index, 1)[0];
}
