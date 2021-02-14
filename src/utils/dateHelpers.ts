import * as MathX from './mathx';

export function getTime(d: Date | number): number {
    return d instanceof Date ? d.getTime() : d;
}

export function getDate(d: Date | number | string): Date {
    if (!d) {
        return null;
    }

    return new Date(d);
}

type DateFields<T> = {
    [P in keyof T]: T[P] extends Date ? P : never;
}[keyof T];

export function ensureDates<T>(obj: T, ...fields: DateFields<T>[]) {
    if (obj) {
        fields.forEach(f => {
            if (obj[f]) {
                obj[f] = getDate(obj[f] as any) as any;
            }
        });
    }
}

export function isNetworkDay(n: number) { return n >= 1 && n <= 5; }
export function isNetworkDate(d: Date) { return isNetworkDay(d.getUTCDay()); }

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

export function addDays(start: Date, amount: number, condition: (d: Date) => boolean, maxShift = 365) {
    const dir = Math.sign(amount);
    let left = Math.abs(amount);
    let current = start;
    let shift = 0;
    while (left > 0 && shift < maxShift) {
        ++shift;

        current = add(current, dir, 'day', false);
        if (condition(current)) {
            --left;
        }
    }
    return current;
}

export type ConstantGranularity = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week';
export type Granularity = ConstantGranularity | 'month' | 'year';

function granularityToMs(g: ConstantGranularity): number {
    switch (g) {
        case 'millisecond': {
            return 1;
        }
        case 'second': {
            return 1000;
        }
        case 'minute': {
            return 60 * granularityToMs('second');
        }
        case 'hour': {
            return 60 * granularityToMs('minute');
        }
        case 'day': {
            return 24 * granularityToMs('hour');
        }
        case 'week': {
            return 7 * granularityToMs('day');
        }
        default: {
            throw new Error('Unsupported granularity');
        }
    }
}

export namespace DateX {
    export function get(d: Date, g: Granularity, local: boolean) {
        switch (g) {
            case 'year': return local ? d.getFullYear() : d.getUTCFullYear();
            case 'month': return local ? d.getMonth() : d.getUTCMonth();
            case 'week': throw new Error('Not supported');
            case 'day': return local ? d.getDate() : d.getUTCDate();
            case 'hour': return local ? d.getHours() : d.getUTCHours();
            case 'minute': return local ? d.getMinutes() : d.getUTCMinutes();
            case 'second': return local ? d.getSeconds() : d.getUTCSeconds();
            case 'millisecond': return local ? d.getMilliseconds() : d.getUTCMilliseconds();
            default: return d.getTime();
        }
    }

    export function set(d: Date, g: 'year', local: boolean, year: number, month?: number, date?: number): number;
    export function set(d: Date, g: 'month', local: boolean, month: number, date?: number): number;
    export function set(d: Date, g: 'day', local: boolean, date: number): number;
    export function set(d: Date, g: 'hour', local: boolean, hours: number, min?: number, sec?: number, ms?: number): number;
    export function set(d: Date, g: 'minute', local: boolean, min: number, sec?: number, ms?: number): number;
    export function set(d: Date, g: 'second', local: boolean, sec: number, ms?: number): number;
    export function set(d: Date, g: 'millisecond', local: boolean, ms: number): number;

    export function set(d: Date, g: Granularity, local: boolean, ...v: number[]) {
        const fn: (...n: number[]) => number = (() => {
            switch (g) {
                case 'year': return local ? d.setFullYear : d.setUTCFullYear;
                case 'month': return local ? d.setMonth : d.setUTCMonth;
                case 'week': throw new Error('Not supported');
                case 'day': return local ? d.setDate : d.setUTCDate;
                case 'hour': return local ? d.setHours : d.setUTCHours;
                case 'minute': return local ? d.setMinutes : d.setUTCMinutes;
                case 'second': return local ? d.setSeconds : d.setUTCSeconds;
                case 'millisecond': return local ? d.setMilliseconds : d.setUTCMilliseconds;
                default: return null;
            }
        })();
        return fn ? fn.call(d, ...v) : d.getTime();
    }
}

export function convert(amount: number, g: ConstantGranularity, to: ConstantGranularity) {
    const ms = amount * granularityToMs(g);
    const toMs = granularityToMs(to);
    return ms / toMs;
}

export function add(date: Date | number, amount: number, granularity: Granularity, local = false): Date {
    const res = getDate(date);
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
            return new Date(res.getTime() + amount * granularityToMs(granularity));
        }
    }
}

export function compare(d1: Date | number, d2: Date | number, g: Granularity, local?: boolean): number;
export function compare(d1: Date | number, d2: Date | number): number;

export function compare(d1: Date | number, d2: Date | number, g: Granularity = null, local = false) {
    const s1 = g ? startOf(d1, g, local) : d1;
    const s2 = g ? startOf(d2, g, local) : d2;
    return getTime(s1) - getTime(s2);
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
            const granMs = granularityToMs(g);
            const startMs = ms - ms % granMs;
            return new Date(startMs);
        }
    }
}

export function endOf(d: Date | number, g: Granularity, local = false): Date {
    if (g === 'millisecond') {
        return getDate(d);
    }

    const nextD = add(d, 1, g, local);
    const nextDStart = startOf(nextD, g, local);
    const nextDStartMs = nextDStart.getTime();
    return new Date(nextDStartMs - 1);
}

export function isSame(d1: Date | number, d2: Date | number, g: Granularity, local = false) {
    const s1 = startOf(d1, g, local);
    const s2 = startOf(d2, g, local);
    return s1.getTime() === s2.getTime();
}

export function decompose(date: number | Date, local: boolean, ...grans: Granularity[]): Partial<Record<Granularity, number>> {
    const dd = getDate(date);
    const offset = local ? dd.getTimezoneOffset() * 60000 : 0;
    const ms = dd.getTime() + offset;

    return decomposeMs(ms, ...grans);
}

export function decomposeMs<K extends Granularity>(ms: number, ...grans: K[]): Record<K, number> {
    const res: Partial<Record<Granularity, number>> = {};

    // absolute vals
    let secs = Math.round(ms / 1000);
    let mins = Math.trunc(secs / 60);
    let hrs = Math.trunc(mins / 60);
    const days = Math.trunc(hrs / 24);

    // apply only selected granularities
    if (grans.includes('day' as K)) {
        hrs = hrs % 24;
        res.day = days;
    }

    if (grans.includes('hour' as K)) {
        mins = mins % 60;
        res.hour = hrs;
    }

    if (grans.includes('minute' as K)) {
        secs = secs % 60;
        res.minute = mins;
    }

    if (grans.includes('second' as K)) {
        res.second = secs;
    }

    return res;
}

export function decomposeDate<K extends Granularity>(d: Date, local: boolean, ...grans: K[]): Record<K, number> {
    const res: Partial<Record<Granularity, number>> = {};
    grans.forEach(g => {
        if (g !== 'week') {
            const diff = g === 'month' ? 1 : 0;
            res[g] = DateX.get(d, g, local) + diff;
        }
    });
    return res;
}

export namespace Format {

    export enum Presets {
        FullDay_ShortDate = 'ddd DD.MM.YYYY',
        ShortDate_FullTime = 'DD.MM.YYYY HH:mm:ss',
    }

    export namespace Presets {
        const defaultFormat = new Intl.DateTimeFormat('default');
        const fullDayShortDate = new Intl.DateTimeFormat('default', {
            weekday: 'long',
        });

        export function use(p: Presets, d: Date, local = true) {
            const dec = decomposeDate(d, local, 'year', 'month', 'day', 'hour', 'minute', 'second');
            switch (p) {
                case Presets.FullDay_ShortDate: {
                    const pts = fullDayShortDate.formatToParts(d);
                    const weekday = pts.find(t => t.type === 'weekday');
                    return `${weekday.value} ${MathX.format(dec.day, 2)}.${MathX.format(dec.month, 2)}.${MathX.format(dec.year)}`;
                }
                case Presets.ShortDate_FullTime: {
                    return `${MathX.format(dec.day, 2)}.${MathX.format(dec.month, 2)}.${dec.year} ${MathX.format(dec.hour, 2)}.${MathX.format(dec.minute, 2)}.${MathX.format(dec.second, 2)}`;
                }
                default: {
                    break;
                }
            }

        }
    }

    export function timespan(ms: Date | number, local = false): string {
        const decs = decompose(getTime(ms), local, 'second', 'minute', 'hour');

        const parts: string[] = [];

        if (decs.hour) {
            parts.push(`${decs.hour}h`);
        }

        if (decs.minute) {
            parts.push(`${decs.minute}m`);
        }

        parts.push(`${decs.second}s`);

        return parts.join(' ');
    }

    /** `YYYY-MM-DD` */
    export function toDatePicker(date: Date | number, local = false): string {
        if (!date) return null;
        const d = getDate(date);
        const dd = decomposeDate(d, local, 'day', 'month', 'year');
        return `${dd.year}-${MathX.format(dd.month, 2)}-${MathX.format(dd.day, 2)}`;
    }

    export function toLocalDate(date: Date | number): string {
        if (!date) return null;
        return getDate(date).toLocaleDateString();
    }

    export function yearDate(yd: YearDate, short = false) {
        const d = new Date(1900, yd?.month || 0, yd?.day || 1);
        return d.toLocaleDateString('default', { month: short ? 'short' : 'long', day: 'numeric' });
    }

    // TODO draft
    export function toDistance(to: Date, from = new Date()) {
        const now = from || new Date();
        const isFuture = now.getTime() < to.getTime();
        const days = getDiscreteDiff(to, now, 'day');
        // console.log('toDistance days =', days);
        if (days < 7) {
            if (days < 1) {
                return 'Today';
            }

            if (days < 2) {
                return isFuture ? 'Tomorrow' : 'Yesterday';
            }

            return isFuture
                ? `In ${Math.floor(days)} days`
                : `${Math.floor(days)} days ago`;
        }

        const weeks = Math.floor(days / 7);
        if (weeks < 2) {
            return isFuture
                ? 'In a week'
                : 'Week ago';
        }

        return isFuture
            ? `In ${weeks} weeks`
            : `${weeks} weeks ago`;
    }
}

export namespace Parse {
    /** `YYYY-MM-DD` */
    export function fromDatePicker(str: string, local = false) {
        const result = new Date(str);
        if (local) {
            const offset = result.getTimezoneOffset() * 60000;
            return new Date(result.getTime() + offset);
        }
        return result;
    }
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
            const ms = granularityToMs(granularity);
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

/** Useful for recurring dates like birthday */
export type YearDate = { day: number, month: number };
export namespace YearDate {
    export function isValid(yd: YearDate): yd is YearDate {
        return yd && typeof yd.day === 'number' && typeof yd.month === 'number';
    }

    export function matches(yearDate: YearDate, date: Date | number, local = false) {
        const d = getDate(date);
        return local
            ? d.getMonth() === yearDate?.month && d.getDate() === yearDate?.day
            : d.getUTCMonth() === yearDate?.month && d.getUTCDate() === yearDate?.day;
    }

    export function toDate(yd: YearDate, year = new Date().getUTCFullYear()) {
        if (!yd) {
            return null;
        }
        return new Date(Date.UTC(year, yd.month || 0, yd.day || 1, 12));
    }

    export function fromDate(date: Date | number): YearDate {
        const d = getDate(date);
        return {
            month: d.getUTCMonth(),
            day: d.getUTCDate(),
        };
    }

    export function equals(yd1: YearDate, yd2: YearDate): boolean {
        return yd1?.month === yd2?.month && yd1?.day === yd1?.month;
    }
}

export type Period = { amount: number, granularity: Granularity };
export namespace Period {
    export function forward(period: Period, base: Date | number = new Date()): Date {
        return add(base, period.amount, period.granularity);
    }

    export function backward(period: Period, base: Date | number = new Date()): Date {
        return add(base, -period.amount, period.granularity);
    }

    export function toMs(period: Period) {
        const now = new Date();
        const prev = backward(period, now);
        return now.getTime() - prev.getTime();
    }

    export function format(p: Period) {
        return `${p.amount} ${p.granularity}${p.amount > 1 ? 's' : ''}`;
    }
}
