/** Helpers for time zones, based on `Intl.DateTimeFormat` */
export namespace Timezones {

    export const Current = Intl.DateTimeFormat().resolvedOptions().timeZone;
    export const CurrentOffset = new Date().getTimezoneOffset();

    // https://stackoverflow.com/a/64262840/9053142
    /**
     * Get the offset in minutes for a given time zone and date. Uses Intl.DateTimeFormat
     * to get the time zone name, then parses it to get the offset.
     * @param timeZone time zone name, e.g. 'America/New_York', 'Europe/Kyiv', etc.
     * @param date date to get the offset for. If not provided, uses the current date.
     * @returns offset in minutes. Positive values are west of UTC, negative values are east of UTC.
     */
    export function getOffset(timeZone: string, date?: Date | number) {
        const timeZoneName = Intl.DateTimeFormat('ia', {
            timeZoneName: 'longOffset',
            timeZone,
        })
            .formatToParts(date)
            .find((i) => i.type === 'timeZoneName')
            ?.value;

        const offset = timeZoneName?.slice(3);
        if (!offset) {
            return 0;
        }

        const matchData = offset.match(/([+-])(\d+)(?::(\d+))?/);
        if (!matchData) {
            throw new Error(`cannot parse timezone name: ${timeZoneName} given from ${timeZone}`);
        }

        const [, sign, hour, minute] = matchData;
        let result = parseInt(hour, 10) * 60;
        if (minute) {
            result += parseInt(minute, 10);
        }
        if (sign === '+') {
            result *= -1;
        }

        return result;
    }

    /** Returns a new date with the specified timezone offset applied.
     *
     * Usage case can be imagined like this: if your local wall clock shows time X,
     * what your clock will show when another local wall clock in the specified timezone will be showing time X.
    */
    export function shiftToTimeZone(date: Date, tz: string | number): Date {
        const offset = typeof tz === 'number'
            ? tz
            : getOffset(tz, date);

        const shifted = new Date(date.getTime() + offset * 60 * 1000);
        return shifted;
    }
}
