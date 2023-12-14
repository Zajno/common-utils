
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

export function roundNumber(val: number, signs = 2, mode?: 'floor' | 'ceil') {
    const k = 10 ** signs;
    let v = (val + Number.EPSILON) * k;
    switch (mode) {
        case 'floor': v = Math.floor(v); break;
        case 'ceil': v = Math.ceil(v); break;
        default: v = Math.round(v); break;
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

export function badRandomString(length = 12) {
    const limitedLength = clamp(length, 0, 12);
    const result = Math.random().toString(26).slice(2, 2 + limitedLength);

    // this happens when random number is rounded so no last char
    if (result.length < limitedLength) {
        return result + new Array(limitedLength - result.length).fill('0').join('');
    }

    return result;
}
