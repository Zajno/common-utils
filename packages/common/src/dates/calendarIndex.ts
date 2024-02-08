
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
 * Helps with converting sequential index to zero-based month, week, day index.
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

    constructor(readonly perWeek: number = 7) { }

    public get perMonth() { return this.perWeek * CalendarIndex.WEEKS_PER_MONTH; }

    /** zero-based month index based on `perWeek` property */
    public get month() { return Math.floor(this.raw / this.perMonth); }

    /** zero-based week index based on `perWeek` property */
    public get week() {
        const rest = this.raw % this.perMonth;
        return Math.floor(rest / this.perWeek);
    }

    public get fullWeek() {
        return Math.floor(this.raw / this.perWeek);
    }

    public get day() {
        return this.raw % this.perWeek;
    }

    public set(month: number, week: number = 0, day: number = 0) {
        this.raw = month * this.perMonth + week * this.perWeek + day;
        return this;
    }

    public toIndex(): IDayIndex {
        return {
            month: this.month,
            week: this.week,
            day: this.day,
        };
    }
}
