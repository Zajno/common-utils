import { decomposeMs } from './convert';
import { shiftDate } from './shift';
import { Granularity } from './types';

export namespace DateX {
    export function get(d: Date, g: Granularity, local: boolean) {
        switch (g) {
            case 'year': return local ? d.getFullYear() : d.getUTCFullYear();
            case 'month': return local ? d.getMonth() : d.getUTCMonth();
            case 'week': return getWeek(d, local);
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
    export function set(d: Date, g: 'week', local: boolean, week: number): number;
    export function set(d: Date, g: 'day', local: boolean, date: number): number;
    export function set(d: Date, g: 'hour', local: boolean, hours: number, min?: number, sec?: number, ms?: number): number;
    export function set(d: Date, g: 'minute', local: boolean, min: number, sec?: number, ms?: number): number;
    export function set(d: Date, g: 'second', local: boolean, sec: number, ms?: number): number;
    export function set(d: Date, g: 'millisecond', local: boolean, ms: number): number;

    export function set(d: Date, g: Granularity, local: boolean, ...v: number[]) {
        if (g === 'week') {
            return setWeek(d, local, v[0]);
        }

        type _dateFn = (this: Date, ..._numbers: number[]) => number;

        /* eslint-disable @typescript-eslint/unbound-method -- it's clearly defined as a function with `this: Date`  */
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
        /* eslint-enable @typescript-eslint/unbound-method */

        return fn ? fn.call(d, ...v) : d.getTime();
    }


    function getWeek(d: Date, local: boolean) {
        const year = get(d, 'year', local);

        const firstDay = new Date();
        set(firstDay, 'year', local, year, 0, 1);
        set(firstDay, 'hour', local, 0, 0, 0, 1);
        const diff = (d.getTime() - firstDay.getTime());

        return decomposeMs(diff, 'week').week;
    }

    function setWeek(d: Date, local: boolean, week: number) {
        const current = getWeek(d, local);
        const res = shiftDate(d, (week - current), 'week', local).getTime();

        d.setTime(res);

        return res;
    }
}
