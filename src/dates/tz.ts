
/** This is experimental stuff, so no tests provided, see comments in the code */
export namespace Timezones {

    export const Current = Intl.DateTimeFormat().resolvedOptions().timeZone;
    export const CurrentOffset = new Date().getTimezoneOffset();

    // https://stackoverflow.com/a/64262840/9053142
    // tested locally, but it's hard to write tests since they are based on the local timezone, browser implementation and whether DST is active
    // it's recommended to wrap with try/catch and don't rely it will always work
    export const getOffset = (timeZone: string) => {
        const timeZoneName = Intl.DateTimeFormat('ia', {
            timeZoneName: 'longOffset',
            timeZone,
        })
            .formatToParts()
            .find((i) => i.type === 'timeZoneName').value;

        const offset = timeZoneName.slice(3);
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
    };

    // Tests may look like this:
    /*
        expect(Timezones.getOffset('America/New_York')).toBe(240);
        expect(Timezones.getOffset('Europe/Paris')).toBe(-120);
        expect(Timezones.getOffset('Europe/Kiev')).toBe(-180);
        expect(Timezones.getOffset('Asia/Kolkata')).toBe(-270);
    */

}
