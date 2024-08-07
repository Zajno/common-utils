
export function clamp(val: number, min: number | undefined | null = undefined, max: number | undefined | null = undefined, cycle = false) {
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

export function getIntersection(start1: number, end1: number, start2: number, end2: number): false | { ranges: number[][], intersection: { start: number, end: number} } {
    const v = [start1, end1].sort();
    const r = [start2, end2].sort();

    const res = (v[0] >= r[0] && v[0] <= r[1])
        || (v[1] >= r[0] && v[1] <= r[1])
        || (r[0] >= v[0] && r[0] <= v[1])
        || (r[1] >= v[0] && r[1] <= v[1]);

    if (!res) {
        return false;
    }

    return {
        ranges: [v, r],
        intersection: {
            start: Math.min(v[0], r[0]),
            end: Math.max(v[1], r[1]),
        },
    };
}

export function isIntersected(start1: number, end1: number, start2: number, end2: number) {
    return start1 <= end2 && end1 >= start2;
}

export type RoundMode = 'floor' | 'ceil' | 'round' | 'trunc';

export function roundByMode(val: number, mode: RoundMode) {
    switch (mode) {
        case 'floor': return Math.floor(val);
        case 'ceil': return Math.ceil(val);
        case 'trunc': return Math.trunc(val);
        default: return Math.round(val);
    }
}

export function roundNumber(val: number, signs = 2, mode?: RoundMode) {
    const k = 10 ** signs;
    let v = (val + Number.EPSILON) * k;
    v = roundByMode(v, mode || 'round');
    return v / k;
}

export function roundHalf(num: number): number {
    return Math.round(num * 2) / 2;
}

export function random(min: number = 0, max: number = 1, round: boolean | RoundMode = true) {
    const r = Math.random();
    const res = min + r * (max - min);
    return round
        ? roundByMode(res, round === true ? 'round' : round)
        : res;
}

export function badRandomString(length = 12) {
    const limitedLength = clamp(length, 0, 12);
    const result = Math.random().toString(26).slice(2, 2 + limitedLength);

    // this happens when random number is rounded so no last char
    if (result.length < limitedLength) {
        return result + new Array(limitedLength - result.length).fill('0').join('');
    }

    return result;
}
