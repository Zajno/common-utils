import { getTime } from './convert';
import { endOf, startOf } from './shift';
import { Granularity } from './types';

export function contains(start: Date | number, end: Date | number, target: Date | number, granularity: Granularity = 'second') {
    const t = getTime(target);

    const ss = startOf(start, granularity);
    const ee = endOf(end, granularity);

    return ss.getTime() <= t
        && t <= ee.getTime();
}

export function intersects(start1: Date | number, end1: Date | number, start2: Date | number, end2: Date | number, granularity: Granularity = 'millisecond') {
    const s = startOf(start1, granularity).getTime(),
        e = endOf(end1, granularity).getTime(),
        ss = startOf(start2, granularity).getTime(),
        ee = endOf(end2, granularity).getTime();

    return (ss >= s && ss <= e)
        || (ee >= s && ee <= e)
        || (s >= ss && s <= ee)
        || (e >= ss && e <= ee);
}

export function countDays(start: Date, end: Date, condition: (d: Date) => boolean) {
    let count = 0;

    const current = new Date(start.getTime());
    do {
        if (!condition || condition(current)) {
            ++count;
        }

        current.setUTCDate(current.getUTCDate() + 1);
    } while (current.getTime() <= end.getTime());

    return count;
}

export function compare(d1: Date | number, d2: Date | number, g: Granularity, local?: boolean): number;
export function compare(d1: Date | number, d2: Date | number): number;

export function compare(d1: Date | number, d2: Date | number, g: Granularity = null, local = false) {
    const s1 = g ? startOf(d1, g, local) : d1;
    const s2 = g ? startOf(d2, g, local) : d2;
    return getTime(s1) - getTime(s2);
}

export function min(d1: Date, d2: Date): Date {
    const c = compare(d1, d2);
    return c < 0 ? d1 : d2;
}

export function max(d1: Date, d2: Date): Date {
    const c = compare(d1, d2);
    return c >= 0 ? d1 : d2;
}

export function clamp(d: Date, low: Date, high: Date) {
    const dt = d.getTime();
    const mint = low.getTime();
    const maxt = high.getTime();
    if (dt < mint) {
        return low;
    }
    if (dt > maxt) {
        return high;
    }
    return d;
}
