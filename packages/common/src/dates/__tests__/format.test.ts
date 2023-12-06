import * as DateHelpers from '..';

describe('Date Helpers - Format', () => {

    test('check TZ to be UTC', () => {
        expect(new Date().getTimezoneOffset()).toBe(0); // UTC
    });

    test('toDistance', () => {
        const from = new Date('2020-11-09T15:22:08.959Z');

        expect(DateHelpers.Format.toDistance(from, undefined)).toMatch(/weeks ago/);
        expect(DateHelpers.Format.toDistance(from, null)).toMatch(/weeks ago/);

        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 5, 'hour'), from)).toBe('Today');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 16, 'hour'), from)).toBe('Tomorrow');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 1, 'day'), from)).toBe('Tomorrow');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 2, 'day'), from)).toBe('In 2 days');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 6, 'day'), from)).toBe('In 6 days');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 7, 'day'), from)).toBe('In a week');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 8, 'day'), from)).toBe('In a week');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 13, 'day'), from)).toBe('In a week');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 2, 'week'), from)).toBe('In 2 weeks');

        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -5, 'hour'), from)).toBe('Today');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -16, 'hour'), from)).toBe('Yesterday');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -1, 'day'), from)).toBe('Yesterday');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -2, 'day'), from)).toBe('2 days ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -6, 'day'), from)).toBe('6 days ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -7, 'day'), from)).toBe('Week ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -8, 'day'), from)).toBe('Week ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -13, 'day'), from)).toBe('Week ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -2, 'week'), from)).toBe('2 weeks ago');

    });

    test('toDatePicker', () => {
        expect(DateHelpers.Format.toDatePicker(new Date('2022-12-30T13:26:15.893Z'))).toBe('2022-12-30');

        expect(DateHelpers.Format.toDatePicker(new Date('2019-08-19T00:00:00.000Z'))).toBe('2019-08-19');
        expect(DateHelpers.Format.toDatePicker(undefined)).toBeNull();
    });

    test('yearDate', () => {
        expect(DateHelpers.Format.yearDate({ month: 9, day: 1 })).toBe('October 1');
        expect(DateHelpers.Format.yearDate({ month: 9, day: 1 }, true)).toBe('Oct 1');

        expect(DateHelpers.Format.yearDate({ month: 7, day: 31 })).toBe('August 31');
        expect(DateHelpers.Format.yearDate({ month: 7, day: 31 }, true)).toBe('Aug 31');

        expect(DateHelpers.Format.yearDate({ month: 3, day: 24 })).toBe('April 24');
        expect(DateHelpers.Format.yearDate({ month: 3, day: 24 }, true)).toBe('Apr 24');

        expect(DateHelpers.Format.yearDate({ month: 9, day: null })).toBe('October 1');
        expect(DateHelpers.Format.yearDate({ month: 9, day: null }, true)).toBe('Oct 1');

        expect(DateHelpers.Format.yearDate({ month: null, day: 1 })).toBe('January 1');
        expect(DateHelpers.Format.yearDate({ month: null, day: 1 }, true)).toBe('Jan 1');

        expect(DateHelpers.Format.yearDate({ month: null, day: null })).toBe('January 1');
        expect(DateHelpers.Format.yearDate({ month: null, day: null }, true)).toBe('Jan 1');

        expect(DateHelpers.Format.yearDate(undefined)).toBe('January 1');
        expect(DateHelpers.Format.yearDate(undefined, true)).toBe('Jan 1');
    });

    test('toLocalDate', () => {
        expect(DateHelpers.Format.toLocalDate(new Date('2020-07-29T13:26:15.893Z'))).toBe('7/29/2020');
        expect(DateHelpers.Format.toLocalDate(1608729767257)).toBe('12/23/2020');
        expect(DateHelpers.Format.toLocalDate(undefined)).toBeNull();
    });

    test('Presets.use', () => {

        expect(DateHelpers.Format.Presets.use(
            DateHelpers.Format.Presets.FullDay_ShortDate,
            new Date('2020-08-04T10:26:15.893Z')
        )).toBe('Tuesday 04.08.2020');

        expect(DateHelpers.Format.Presets.use(
            DateHelpers.Format.Presets.ShortDate_FullTime,
            new Date('2019-09-11T10:26:15.893Z')
        )).toBe('11.09.2019 10.26.15');

        expect(DateHelpers.Format.Presets.use(
            DateHelpers.Format.Presets.FullDay_ShortDate,
            new Date('2020-12-20T01:31:59.893Z'),
            false
        )).toBe('Sunday 20.12.2020');

        expect(DateHelpers.Format.Presets.use(
            DateHelpers.Format.Presets.ShortDate_FullTime,
            new Date('2020-08-12T10:26:15.893Z'),
            false
        )).toBe('12.08.2020 10.26.15');

        expect(DateHelpers.Format.Presets.use(
            undefined,
            new Date('2020-08-12T10:26:15.893Z')
        )).toBeUndefined();
    });

    describe('Ordinal.createFormatter', () => {
        it('returns a function', () => {
            const formatter = DateHelpers.Format.Ordinal.createFormatter();
            expect(typeof formatter).toBe('function');
        });

        it('returns correct ordinal strings', () => {
            expect(DateHelpers.Format.Ordinal.format(1)).toBe('1st');
            expect(DateHelpers.Format.Ordinal.format(2)).toBe('2nd');
            expect(DateHelpers.Format.Ordinal.format(3)).toBe('3rd');
            expect(DateHelpers.Format.Ordinal.format(4)).toBe('4th');
            expect(DateHelpers.Format.Ordinal.format(11)).toBe('11th');
            expect(DateHelpers.Format.Ordinal.format(12)).toBe('12th');
            expect(DateHelpers.Format.Ordinal.format(13)).toBe('13th');
            expect(DateHelpers.Format.Ordinal.format(21)).toBe('21st');
            expect(DateHelpers.Format.Ordinal.format(22)).toBe('22nd');
            expect(DateHelpers.Format.Ordinal.format(23)).toBe('23rd');
            expect(DateHelpers.Format.Ordinal.format(24)).toBe('24th');
        });
      });
});
