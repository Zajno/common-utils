
export interface IMonthIndex {
    month: number;
}

export interface IWeekIndex extends IMonthIndex {
    week: number;
}

export interface IDayIndex extends IWeekIndex {
    day: number;
}

/**
 * Helps with converting sequential index to 0- or 1-based month, week, day index.
 *
 * Allows to use any number of days per week, not just 7. Also one can set any number of weeks per month (but it will be used globally).
 *
 * To update the value, either set `raw` property or use `set` method.
 *
 * Usage case: some ordered sequence of items, each has its own index, and you want to distribute them by months, weeks and days, knowing the number of items assigned per week.
 */
export class CalendarIndex implements IDayIndex {

    static WEEKS_PER_MONTH = 4;

    /** sequential index */
    public raw: number = 0;

    /**
     * @param perWeek how many indexes allocated per week
     * @param [base=0] 1 or 0 - determines base for all indexes (0 by default)
     */
    constructor(readonly perWeek: number = 7, readonly base: 1 | 0 = 0) { }

    public get perMonth() { return this.perWeek * CalendarIndex.WEEKS_PER_MONTH; }

    /** 1/0-based month index based on `perWeek` property */
    public get month() {
        if (this.raw <= 0) {
            return 0;
        }

        return basedFloor(this.base, this.raw, this.perMonth);
    }

    public get fullWeek() {
        if (this.raw <= 0) {
            return 0;
        }

        return basedFloor(this.base, this.raw, this.perWeek);
    }

    /** 1/0-based week index based on `perWeek` property */
    public get week() {
        const fw = this.fullWeek;
        if (fw === 0) {
            return 0;
        }

        return basedRemainder(this.base, fw, CalendarIndex.WEEKS_PER_MONTH);
    }

    public get day() {
        return basedRemainder(this.base, this.raw, this.perWeek);
    }

    public set(month: number, week: number = this.base, day: number = this.base) {
        const m = Math.max(month - this.base, 0);
        const w = Math.max(week - this.base, 0);
        this.raw = m * this.perMonth + w * this.perWeek + day;
        return this;
    }

    public toIndex(): IDayIndex {
        return {
            month: this.month,
            week: this.week,
            day: this.day,
        };
    }

    public clone() {
        const res = new CalendarIndex(this.perWeek, this.base);
        res.raw = this.raw;
        return res;
    }
}

/** returns based (1/0) remainder of `value / div`
 *
 * Ex.: get day of week
*/
export function basedRemainder(this: void, base: 1 | 0, value: number, div: number) {
    return (value - base) % div + base;
}

/** returns based (1/0) floor'ed of `value / div` */
export function basedFloor(this: void, base: 1 | 0, value: number, div: number) {
    return Math.floor((value - base) / div) + base;
}
