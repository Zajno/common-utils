import { getDate, getTime } from './parse';
import { DateX } from './datex';
import { Granularity } from './types';

export function addDays(start: Date, amount: number, condition: (d: Date) => boolean, maxShift = 365) {
    const dir = Math.sign(amount);
    let left = Math.abs(amount);
    let current = start;
    let shift = 0;
    while (left > 0 && shift < maxShift) {
        ++shift;

        current = shiftDate(current, dir, 'day', false);
        if (condition(current)) {
            --left;
        }
    }
    return current;
}


export function shiftDate(date: Date | number, amount: number, granularity: Granularity, local = false): Date {
    const res = getDate(date);
    if (amount === 0) {
        return res;
    }

    switch (granularity) {
        case 'month': {
            DateX.set(res, 'month', local, DateX.get(res, 'month', local) + amount);
            return res;
        }
        case 'year': {
            DateX.set(res, 'year', local, DateX.get(res, 'year', local) + amount);
            return res;
        }
        default: {
            return Granularity.Constant.shift(res, amount, granularity);
        }
    }
}

/** @deprecated Use {@link shiftDate} instead */
export const add = shiftDate;

export function startOf(d: Date | number, g: Granularity, local = false): Date {
    const ms = getTime(d);
    switch (g) {
        case 'week': {
            const startOfDay = startOf(d, 'day', local);
            let v = DateX.get(startOfDay, 'day', local) + 1;
            v -= local ? startOfDay.getDay() : startOfDay.getUTCDay();
            DateX.set(startOfDay, 'day', local, v);
            return startOfDay;
        }
        case 'month': {
            const startOfDay = startOf(d, 'day', local);
            DateX.set(startOfDay, 'day', local, 1);
            return startOfDay;
        }
        case 'year': {
            const startOfDay = startOf(d, 'day', local);
            DateX.set(startOfDay, 'month', local, 0, 1);
            return startOfDay;
        }
        case 'day': {
            const startOfHour = getDate(d);
            DateX.set(startOfHour, 'hour', local, 0, 0, 0, 0);
            return startOfHour;
        }
        case 'millisecond': {
            return getDate(d);
        }
        default: {
            const granMs = Granularity.Constant.toMs(g);
            const startMs = ms - ms % granMs;
            return new Date(startMs);
        }
    }
}

export function endOf(d: Date | number, g: Granularity, local = false): Date {
    if (g === 'millisecond') {
        return getDate(d);
    }

    const nextD = shiftDate(d, 1, g, local);
    const nextDStart = startOf(nextD, g, local);
    const nextDStartMs = nextDStart.getTime();
    return new Date(nextDStartMs - 1);
}

export function isSame(d1: Date | number, d2: Date | number, g: Granularity, local = false) {
    const s1 = startOf(d1, g, local);
    const s2 = startOf(d2, g, local);
    return s1.getTime() === s2.getTime();
}
