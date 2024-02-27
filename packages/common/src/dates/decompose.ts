import { getDate } from './parse';
import { Granularity } from './types';

export type DecomposeGranularity = 'week' | 'day' | 'hour' | 'minute' | 'second';

export function decomposeMs<K extends Granularity & DecomposeGranularity>(ms: number, ...grans: K[]): Record<K, number> {
    const res: Partial<Record<Granularity, number>> = {};

    // absolute values
    let secs = Math.round(Granularity.Constant.convert(ms, 'millisecond', 'second'));
    let mins = Granularity.Constant.convert(secs, 'second', 'minute');
    let hrs = Granularity.Constant.convert(mins, 'minute', 'hour');
    let days = Granularity.Constant.convert(hrs, 'hour', 'day');

    // apply only selected granularity
    if (grans.includes('week' as K)) {
        // week is 1-based!
        res.week = Math.floor(days / 7) + 1;
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

export function decompose(date: number | Date, local: boolean, ...grans: (Granularity & DecomposeGranularity)[]): Partial<Record<DecomposeGranularity, number>> {
    const dd = getDate(date);
    const offset = local ? dd.getTimezoneOffset() * 60000 : 0;
    const ms = dd.getTime() + offset;

    return decomposeMs(ms, ...grans);
}
