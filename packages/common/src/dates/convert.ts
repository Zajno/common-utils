import { DateX } from './datex';
import { getDate, getTime } from './parse';
import { isSame, startOf } from './shift';
import { ConstantGranularity, Granularity } from './types';

type DateFields<T> = {
    [P in keyof T]: T[P] extends Date ? P : never;
}[keyof T];

export function ensureDates<T>(obj: T, ...fields: DateFields<T>[]) {
    if (obj) {
        fields.forEach(f => {
            const v = obj[f] as Date | string | number;
            if (v) {
                obj[f] = getDate(v) as NonNullable<T>[DateFields<T>];
            }
        });
    }
}

export function isNetworkDay(n: number) { return n >= 1 && n <= 5; }
export function isNetworkDate(d: Date) { return isNetworkDay(d.getUTCDay()); }

export function convert(amount: number, g: ConstantGranularity, to: ConstantGranularity) {
    const ms = amount * ConstantGranularity.toMs(g);
    const toMs = ConstantGranularity.toMs(to);
    return ms / toMs;
}

export function unix(d: Date | number) {
    return Math.floor(getTime(d) / 1000);
}

export function unixDayIndex(d: Date | number) {
    return Math.floor(getTime(d) / (1000 * 3600 * 24));
}

export function dateFromUnixDayIndex(d: number) {
    return new Date(d * 1000 * 3600 * 24);
}

export function decompose(date: number | Date, local: boolean, ...grans: (Granularity & DecomposeGranularity)[]): Partial<Record<DecomposeGranularity, number>> {
    const dd = getDate(date);
    const offset = local ? dd.getTimezoneOffset() * 60000 : 0;
    const ms = dd.getTime() + offset;

    return decomposeMs(ms, ...grans);
}

type DecomposeGranularity = 'week' | 'day' | 'hour' | 'minute' | 'second';

export function decomposeMs<K extends Granularity & DecomposeGranularity>(ms: number, ...grans: K[]): Record<K, number> {
    const res: Partial<Record<Granularity, number>> = {};

    // absolute values
    let secs = Math.round(convert(ms, 'millisecond', 'second'));
    let mins = convert(secs, 'second', 'minute');
    let hrs = convert(mins, 'minute', 'hour');
    let days = convert(hrs, 'hour', 'day');

    // apply only selected granularity
    if (grans.includes('week' as K)) {
        res.week = Math.ceil(days / 7);
        days = days % 7;
    }

    if (grans.includes('day' as K)) {
        res.day = Math.trunc(days);
        hrs = hrs % 24;
    }

    if (grans.includes('hour' as K)) {
        res.hour = Math.trunc(hrs);
        mins = mins % 60;
    }

    if (grans.includes('minute' as K)) {
        res.minute = Math.trunc(mins);
        secs = secs % 60;
    }

    if (grans.includes('second' as K)) {
        res.second = secs;
    }

    return res as Record<K, number>;
}

export function decomposeDate<K extends Granularity>(d: Date, local: boolean, ...grans: K[]): Record<K, number> {
    const res: Partial<Record<Granularity, number>> = {};
    grans.forEach(g => {
        const diff = g === 'month' ? 1 : 0;
        res[g] = DateX.get(d, g, local) + diff;
    });
    return res as Record<K, number>;
}


export function splitDatesByDay(dates: number[]): number[][] {
    if (!dates) {
        return [];
    }

    const res: number[][] = [];
    let currentDate: number;
    let tmpArr: number[];

    const datesCopy = [...dates];

    datesCopy
        .sort()
        .forEach(date => {
            if (!currentDate) {
                currentDate = new Date(date).getTime();
            }

            if (!tmpArr) {
                tmpArr = [];
                res.push(tmpArr);
            }

            if (isSame(date, currentDate, 'day', true)) {
                tmpArr.push(currentDate);
            } else {
                currentDate = new Date(date).getTime();
                tmpArr = [date];
                res.push(tmpArr);
            }
        });

    return res;
}

export function getDiscreteDiff(d1: number | Date, d2: number | Date, granularity: Granularity, local = false, absolute = true) {
    let v1: number, v2: number;

    switch (granularity) {
        case 'year': {
            const dd1 = getDate(d1);
            const dd2 = getDate(d2);
            v1 = local ? dd1.getFullYear() : dd1.getUTCFullYear();
            v2 = local ? dd2.getFullYear() : dd2.getUTCFullYear();
            break;
        }

        case 'month': {
            const dd1 = getDate(d1);
            const dd2 = getDate(d2);
            v1 = local ? dd1.getMonth() : dd1.getUTCMonth();
            v2 = local ? dd2.getMonth() : dd2.getUTCMonth();
            break;
        }

        default: {
            const ms = ConstantGranularity.toMs(granularity);
            v1 = startOf(d1, granularity, local).getTime() / ms;
            v2 = startOf(d2, granularity, local).getTime() / ms;
            break;
        }
    }

    let diff = v2 - v1;
    if (absolute) {
        diff = Math.abs(diff);
    }

    return Math.round(diff);
}

export function getDaysStreak(dates: number[], descentOrder: boolean): number {
    let streak = 0;
    let d = dates;
    let dayToCompare = Date.now();

    if (descentOrder) {
        d = dates.slice().sort().reverse();
    }

    for (let i = 0; i < d.length; i++) {
        const diff = getDiscreteDiff(dayToCompare, d[i], 'day', true);

        if (diff >= 2) {
            break;
        }
        if (diff === 0 && streak === 0) {
            streak = 1;
        }

        streak += diff;

        if (diff > 0) {
            dayToCompare = d[i];
        }
    }

    return streak > 1 ? streak : 0;
}
