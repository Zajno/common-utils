import { getDate } from './parse.js';

/** Useful for recurring dates like birthday */
export type YearDate = { day: number | null, month: number | null };

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
