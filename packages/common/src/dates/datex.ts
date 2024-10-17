import { Granularity } from './types.js';
import { decomposeMs } from './decompose.js';
import { getDate } from './parse.js';

export namespace DateX {

    export type DateGranularity = Granularity | 'weekDay';

    export function get(d: Date, g: DateGranularity, local: boolean): number {
        switch (g) {
            case 'year': return local ? d.getFullYear() : d.getUTCFullYear();
            case 'month': return local ? d.getMonth() : d.getUTCMonth();
            case 'week': return getWeek(d, local);
            case 'day': return local ? d.getDate() : d.getUTCDate();
            case 'weekDay': return local ? d.getDay() : d.getUTCDay();
            case 'hour': return local ? d.getHours() : d.getUTCHours();
            case 'minute': return local ? d.getMinutes() : d.getUTCMinutes();
            case 'second': return local ? d.getSeconds() : d.getUTCSeconds();
            case 'millisecond': return local ? d.getMilliseconds() : d.getUTCMilliseconds();
            default: return d.getTime();
        }
    }

    export function set(d: Date, g: 'year', local: boolean, year: number, month?: number, date?: number): number;
    export function set(d: Date, g: 'month', local: boolean, month: number, date?: number): number;
    export function set(d: Date, g: 'week', local: boolean, week: number): number;
    export function set(d: Date, g: 'day', local: boolean, date: number): number;
    export function set(d: Date, g: 'weekDay', local: boolean, weekDay: number): number;
    export function set(d: Date, g: 'hour', local: boolean, hours: number, min?: number, sec?: number, ms?: number): number;
    export function set(d: Date, g: 'minute', local: boolean, min: number, sec?: number, ms?: number): number;
    export function set(d: Date, g: 'second', local: boolean, sec: number, ms?: number): number;
    export function set(d: Date, g: 'millisecond', local: boolean, ms: number): number;

    export function set(d: Date, g: DateGranularity, local: boolean, ...v: (number | undefined)[]): number {
        if (g === 'week') {
            return setWeek(d, local, v[0] ?? 0);
        }

        if (g === 'weekDay') {
            return setDayOfWeek(d, v[0] ?? 0, null, local).getTime();
        }

        type _dateFn = (this: Date, ..._numbers: number[]) => number;

        const fn: null | _dateFn = (() => {
            switch (g) {
                case 'year': return local ? d.setFullYear : d.setUTCFullYear;
                case 'month': return local ? d.setMonth : d.setUTCMonth;
                case 'day': return local ? d.setDate : d.setUTCDate;
                case 'hour': return local ? d.setHours : d.setUTCHours;
                case 'minute': return local ? d.setMinutes : d.setUTCMinutes;
                case 'second': return local ? d.setSeconds : d.setUTCSeconds;
                case 'millisecond': return local ? d.setMilliseconds : d.setUTCMilliseconds;
                default: return null;
            }
        })();

        return fn ? fn.call(d, ...v as number[]) : d.getTime();
    }


    function getWeek(d: Date, local: boolean) {
        const year = get(d, 'year', local);

        const firstDay = new Date(d);
        set(firstDay, 'year', local, year, 0, 1);
        set(firstDay, 'hour', local, 0, 0, 0, 0);

        // we need to find diff between the target date and the first Sunday in the year

        // next closest Sunday in the future, is considered as the start of the second week
        const secondWeekSunday = setDayOfWeek(firstDay, 0, true, local);

        let offset = 1;

        const secondWeekSundayT = secondWeekSunday.getTime();

        if (firstDay.getTime() === secondWeekSundayT) {
            // the target date is the first Sunday (first day in week) in the year
            offset = 0;
        }

        const t = d.getTime();
        if (t < secondWeekSundayT) {
            // the target date is in the first week
            return 1;
        }

        const diff = t - secondWeekSundayT;
        // the returned value is 1-based
        const { week } = decomposeMs(diff, 'week');

        // adding offset since counting from 2nd week
        return week + offset;
    }

    function setWeek(d: Date, local: boolean, week: number) {
        const current = getWeek(d, local);
        const res = Granularity.Constant.shift(d, (week - current), 'week').getTime();

        d.setTime(res);

        return res;
    }
}

/**
 * Allows to set day of week, symmetric to Date.getDay()
 * @param d Date representation
 * @param dayOfWeek 0..6 Sunday..Saturday
 * @param future true - only forward or present, false - only backward or present, null - closest
 * @param local whether to use local time
 * @returns Date with the same time as d, but with the updated day of week
 */
export function setDayOfWeek(d: Date | number, dayOfWeek: number, future: boolean | null = null, local = false) {
    const res = getDate(d);
    const currentDayOfWeek = DateX.get(res, 'weekDay', local);
    let diff = dayOfWeek - currentDayOfWeek;

    if (future != null) {
        if (future && diff < 0) {
            diff += 7;
        }
        if (!future && diff > 0) {
            diff -= 7;
        }
    }
    return Granularity.Constant.shift(res, diff, 'day');
}
