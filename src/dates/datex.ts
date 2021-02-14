import { Granularity } from './types';

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
