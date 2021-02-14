
export function clamp(val: number, min: number = undefined, max: number = undefined, cycle = false) {
    if (min != null && val < min) {
        return (max != null && cycle) ? max : min;
    }

    if (max != null && val > max) {
        return (min != null && cycle) ? min : max;
    }

    return val;
}

export function clamp01(val: number) {
    return clamp(val, 0, 1, false);
}

export function contains(val: number, from: number, to: number) {
    const s = Math.min(from, to);
    const e = Math.max(from, to);
    return val >= s && val <= e;
}

export function getIntersection(v1: number, v2: number, r1: number, r2: number): false | { ranges: number[][], merged: { s: number, e: number} } {
    const v = [v1, v2].sort();
    const r = [r1, r2].sort();

    const res = (v[0] >= r[0] && v[0] <= r[1])
        || (v[1] >= r[0] && v[1] <= r[1])
        || (r[0] >= v[0] && r[0] <= v[1])
        || (r[1] >= v[0] && r[1] <= v[1]);

    if (!res) {
        return false;
    }

    return {
        ranges: [v, r],
        merged: {
            s: Math.min(v[0], r[0]),
            e: Math.max(v[1], r[1]),
        },
    };
}

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

export function normalize(arr: number[]): number[] {
    if (arr.length === 0) {
        return arr;
    }

    const min = arrayMin(arr);
    const max = arrayMax(arr);
    const dist = max - min;
    if (Math.abs(dist) < 0.000001) { // almost zero
        return arr.map(_ => 1);
    }

    return arr.map(x => (x - min) / dist);
}

export function roundNumber(val: number, signs = 2, mode?: 'floor' | 'ceil') {
    const k = 10 ** signs;
    let v = (val + Number.EPSILON) * k;
    switch (mode) {
        case 'floor':   v = Math.floor(v); break;
        case 'ceil':    v = Math.ceil(v); break;
        default:        v = Math.round(v); break;
    }
    return v / k;
}

export function roundHalf(num: number): number {
    return Math.round(num * 2) / 2;
}

export function random(min: number = 0, max: number = 1, trunc = true) {
    const r = Math.random();
    const res = min + r * (max - min);
    return trunc ? Math.trunc(res) : res;
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

export function getNumberSuffix(num: number) {
    const lastDigit = (num || 0) % 10;

    switch (lastDigit) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

export function format(n: number, digits?: number) {
    const res = n.toString();
    if (digits && digits > res.length) {
        return res.padStart(digits, '0');
    }
    return res;
}

export type Distribution<T extends keyof any> = { total: number, byType: Partial<Record<T, number>> };

export function extendDistribution<T extends keyof any>(count: number, type: T, current?: Distribution<T>): Distribution<T> {
    const res: Distribution<T> = current ?? { total: 0, byType: { } };
    if (!res.byType) {
        res.byType = { };
    }

    if (count > 0) {
        res.byType[type] = (res.byType[type] || 0) + count;
        res.total += count;
    }

    return res;
}
