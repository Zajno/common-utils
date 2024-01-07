import * as DateHelpers from '..';

describe('Date Helpers', () => {
    test('startOf', () => {
        const day = new Date('2019-08-21T09:08:33.697Z');

        expect(new Date().getTimezoneOffset()).toBe(0);

        expect(DateHelpers.startOf(day, 'minute')).toStrictEqual(new Date('2019-08-21T09:08:00.000Z'));

        expect(DateHelpers.startOf(day, 'hour')).toStrictEqual(new Date('2019-08-21T09:00:00.000Z'));

        expect(DateHelpers.startOf(day, 'day')).toStrictEqual(new Date('2019-08-21T00:00:00.000Z'));

        expect(DateHelpers.startOf(day, 'week')).toStrictEqual(new Date('2019-08-19T00:00:00.000Z'));

        expect(DateHelpers.startOf(day, 'month')).toStrictEqual(new Date('2019-08-01T00:00:00.000Z'));

        expect(DateHelpers.startOf(day, 'year')).toStrictEqual(new Date('2019-01-01T00:00:00.000Z'));
    });

    test('endOf', () => {
        const day = new Date('2019-08-21T09:08:33.697Z');

        expect(DateHelpers.endOf(day, 'minute')).toStrictEqual(new Date('2019-08-21T09:08:59.999Z'));

        expect(DateHelpers.endOf(day, 'hour')).toStrictEqual(new Date('2019-08-21T09:59:59.999Z'));

        expect(DateHelpers.endOf(day, 'day')).toStrictEqual(new Date('2019-08-21T23:59:59.999Z'));

        expect(DateHelpers.endOf(day, 'week')).toStrictEqual(new Date('2019-08-25T23:59:59.999Z'));

        expect(DateHelpers.endOf(day, 'month')).toStrictEqual(new Date('2019-08-31T23:59:59.999Z'));

        expect(DateHelpers.endOf(day, 'year')).toStrictEqual(new Date('2019-12-31T23:59:59.999Z'));
    });

    test('add', () => {
        const now = new Date('2020-11-09T15:22:08.959Z');

        expect(DateHelpers.shiftDate(now, 1, 'day')).toStrictEqual(new Date('2020-11-10T15:22:08.959Z'));
        expect(DateHelpers.shiftDate(now, -1, 'day')).toStrictEqual(new Date('2020-11-08T15:22:08.959Z'));

    });

    test('getDiscreteDiff', () => {
        const d1 = new Date('2020-11-30T13:26:15.893Z');

        expect(DateHelpers.getDiscreteDiff(d1, d1, 'day', false, false)).toBe(0);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-11-30T13:26:15.893Z'),
            'day', true, false)
        ).toBe(365);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2020-12-01T13:26:15.893Z'),
            'day')
        ).toBe(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2020-11-29T13:26:15.893Z'),
            'day')
        ).toBe(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2020-11-29T13:26:15.893Z'),
            'day', false, false)
        ).toBe(-1);

        expect(DateHelpers.getDiscreteDiff(
            new Date('2020-11-30T00:00:00.001Z'),
            new Date('2020-11-29T23:59:59.999Z'),
            'day', false, false)
        ).toBe(-1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-11-29T13:26:15.893Z'),
            'year')
        ).toBe(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-11-29T13:26:15.893Z'),
            'year', true)
        ).toBe(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-12-01T13:26:15.893Z'),
            'month')
        ).toBe(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-12-01T13:26:15.893Z'),
            'month', true)
        ).toBe(1);

        expect(() => DateHelpers.getDiscreteDiff(
            undefined as any,
            new Date('2021-12-01T13:26:15.893Z'),
            'year')
        ).toThrow();
    });

    test('intersects', () => {

        expect(DateHelpers.intersects(
            new Date('2020-11-30T13:26:15.892Z'),
            new Date('2020-11-30T13:26:15.892Z'),
            new Date('2020-11-30T13:26:15.893Z'),
            new Date('2020-11-30T13:26:15.893Z'),
            'millisecond',
        )).toBeFalsy();

        expect(DateHelpers.intersects(
            new Date('2020-11-30T13:26:15.892Z'),
            new Date('2020-11-30T13:26:15.892Z'),
            new Date('2020-11-30T13:26:15.893Z'),
            new Date('2020-11-30T13:26:15.893Z'),
            'second',
        )).toBeTruthy();

        expect(DateHelpers.intersects(
            new Date('2020-11-30T13:26:15.892Z'),
            new Date('2020-11-30T13:26:15.892Z'),
            new Date('2020-11-30T13:26:15.893Z'),
            new Date('2020-11-30T13:26:15.893Z'),
            'day',
        )).toBeTruthy();

        expect(DateHelpers.intersects(
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-11-29T23:59:59.999Z'),
            new Date('2020-11-30T00:00:00.000Z'),
            new Date('2020-11-30T13:26:15.893Z'),
            'day',
        )).toBeFalsy();

        expect(DateHelpers.intersects(
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-11-29T23:59:59.999Z'),
            new Date('2020-11-30T00:00:00.000Z'),
            new Date('2020-11-30T13:26:15.893Z'),
        )).toBeFalsy();

        expect(DateHelpers.intersects(
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            'day'
        )).toBeTruthy();

        expect(DateHelpers.intersects(
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-12-30T13:26:15.892Z'),
            new Date('2020-12-29T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            'day'
        )).toBeTruthy();

        expect(DateHelpers.intersects(
            new Date('2020-11-19T13:26:15.892Z'),
            new Date('2020-12-30T13:26:15.892Z'),
            new Date('2020-12-29T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            'day'
        )).toBeTruthy();

        expect(DateHelpers.intersects(
            new Date('2020-12-19T13:26:15.892Z'),
            new Date('2020-12-30T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-12-29T13:26:15.892Z'),
            'day'
        )).toBeTruthy();

        expect(DateHelpers.intersects(
            new Date('2020-12-19T13:26:15.892Z'),
            new Date('2020-12-20T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-12-29T13:26:15.892Z'),
            'day'
        )).toBeTruthy();

        expect(DateHelpers.intersects(
            new Date('2020-12-19T13:26:15.892Z'),
            new Date('2020-12-20T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-12-29T13:26:15.892Z'),
            'week'
        )).toBeTruthy();

        expect(DateHelpers.intersects(
            new Date('2020-12-19T13:26:15.892Z'),
            new Date('2020-12-20T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-12-29T13:26:15.892Z'),
            'month'
        )).toBeTruthy();

        expect(DateHelpers.intersects(
            new Date('2020-12-19T13:26:15.892Z'),
            new Date('2020-12-20T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-12-29T13:26:15.892Z'),
            'year'
        )).toBeTruthy();

        expect(() => DateHelpers.intersects(
            new Date('2020-12-19T13:26:15.892Z'),
            new Date('2020-12-20T13:26:15.892Z'),
            new Date('2020-11-29T13:26:15.892Z'),
            new Date('2020-12-29T13:26:15.892Z'),
            null as any
        )).toThrow('Unsupported granularity');
    });

    test('countDays', () => {

        expect(DateHelpers.countDays(
            new Date('2019-12-21T13:26:15.893Z'),
            new Date('2020-01-03T13:26:15.893Z'),
            undefined)
        ).toBe(14);

        expect(DateHelpers.countDays(
            new Date('2019-12-29T13:26:15.893Z'),
            new Date('2020-01-07T13:26:15.893Z'),
            DateHelpers.isNetworkDate)
        ).toBe(7);

        expect(DateHelpers.countDays(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-12-10T13:26:15.893Z'),
            undefined)
        ).toBe(12);

        expect(DateHelpers.countDays(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-11T13:26:15.893Z'),
            undefined)
        ).toBe(1);

        expect(DateHelpers.countDays(
            new Date('2020-12-10T13:26:15.893Z'),
            new Date('2020-12-21T13:26:15.893Z'),
            undefined)
        ).toBe(12);

        expect(DateHelpers.countDays(
            new Date('2020-12-10T13:26:15.893Z'),
            new Date('2020-12-21T13:26:15.893Z'),
            DateHelpers.isNetworkDate)
        ).toBe(8);

        expect(DateHelpers.countDays(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-11T13:26:15.893Z'),
            DateHelpers.isNetworkDate)
        ).toBe(0);
    });

    test('isSame', () => {

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-02-12T19:36:14.893Z'),
            'year',
            true
        )).toBeTruthy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2018-11-29T13:26:15.893Z'),
            'year',
            true
        )).toBeFalsy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-02T19:26:15.893Z'),
            'month',
            true
        )).toBeTruthy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-10-24T13:26:15.893Z'),
            'month',
            true
        )).toBeFalsy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-12-02T19:26:15.893Z'),
            'week',
            true
        )).toBeTruthy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-24T13:26:15.893Z'),
            'week',
            true
        )).toBeFalsy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-29T19:26:15.893Z'),
            'day',
            true
        )).toBeTruthy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-11T13:26:15.893Z'),
            'day',
            true
        )).toBeFalsy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-29T13:01:15.893Z'),
            'hour',
            true
        )).toBeTruthy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-29T18:01:15.893Z'),
            'hour',
            true
        )).toBeFalsy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-29T13:26:01.123Z'),
            'minute',
            true
        )).toBeTruthy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-29T13:27:15.893Z'),
            'minute',
            true
        )).toBeFalsy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-29T13:26:15.123Z'),
            'second',
            true
        )).toBeTruthy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.434'),
            new Date('2020-11-29T13:26:02.213Z'),
            'second',
            true
        )).toBeFalsy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-29T13:26:15.893Z'),
            'millisecond',
            true
        )).toBeTruthy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2018-11-29T13:26:15.891Z'),
            'millisecond',
            true
        )).toBeFalsy();

        expect(DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2018-11-29T13:26:15.891Z'),
            'millisecond',
        )).toBeFalsy();

        expect(() => DateHelpers.isSame(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2018-11-29T13:26:15.891Z'),
            undefined as any,
        )).toThrow('Unsupported granularity');
    });

    test('compare', () => {

        expect(DateHelpers.compare(
            new Date('2020-12-30T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toBe(86400000);

        expect(DateHelpers.compare(
            new Date('2020-12-30T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
            'day',
            true
        )).toBe(86400000);

        expect(DateHelpers.compare(
            new Date('2020-12-28T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toBe(-86400000);

    });

    test('unix', () => {

        expect(DateHelpers.unix(new Date('2020-12-30T13:26:15.893Z'))).toBe(1609334775);

        expect(DateHelpers.unix(new Date('2020-12-12T13:26:15.893Z'))).toBe(1607779575);
    });

    test('unixDayIndex', () => {

        expect(DateHelpers.unixDayIndex(new Date('2020-12-30T13:26:15.893Z'))).toBe(18626);

        expect(DateHelpers.unixDayIndex(new Date('2022-12-30T13:26:15.893Z'))).toBe(19356);
    });

    test('dateFromUnixDayIndex', () => {

        expect(DateHelpers.dateFromUnixDayIndex(18626)).toStrictEqual(new Date('2020-12-30T00:00:00.000Z'));

        expect(DateHelpers.dateFromUnixDayIndex(19356)).toStrictEqual(new Date('2022-12-30T00:00:00.000Z'));

        expect(DateHelpers.dateFromUnixDayIndex(0)).toStrictEqual(new Date('1970-01-01T00:00:00.000Z'));
    });

    test('convert', () => {

        expect(() => DateHelpers.convert(1000, undefined as any, 'second')).toThrow('Unsupported granularity');

        expect(DateHelpers.convert(1000, 'millisecond', 'second')).toBe(1);
        expect(DateHelpers.convert(1000, 'millisecond', 'minute')).toStrictEqual(1 / 60);

        expect(DateHelpers.convert(1000, 'second', 'millisecond')).toStrictEqual(Math.pow(1000, 2));
        expect(DateHelpers.convert(300, 'second', 'minute')).toBe(5);
        expect(DateHelpers.convert(60 * 60, 'second', 'hour')).toBe(1);
        expect(DateHelpers.convert(60 * 60 * 2, 'second', 'day')).toStrictEqual(1 / 12);
        expect(DateHelpers.convert(60 * 60 * 24 * 1.5, 'second', 'week')).toStrictEqual(1.5 / 7);

        expect(DateHelpers.convert(123, 'minute', 'second')).toBe(7380);
        expect(DateHelpers.convert(3213, 'minute', 'hour')).toBe(53.55);
        expect(DateHelpers.convert(60 * 61, 'minute', 'hour')).toBe(61);
        expect(DateHelpers.convert(60 * 36, 'minute', 'day')).toBe(1.5);
        expect(DateHelpers.convert(60 * 24 * 14, 'minute', 'week')).toBe(2);

        expect(DateHelpers.convert(2.5, 'hour', 'second')).toBe(9000);
        expect(DateHelpers.convert(11.5, 'hour', 'minute')).toBe(690);
        expect(DateHelpers.convert(234, 'hour', 'day')).toBe(9.75);
        expect(DateHelpers.convert(24 * 35, 'hour', 'week')).toBe(5);

        expect(DateHelpers.convert(1 / 2, 'day', 'second')).toBe(43200);
        expect(DateHelpers.convert(1 / 60, 'day', 'minute')).toBe(24);
        expect(DateHelpers.convert(11, 'day', 'minute')).toBe(15840);
        expect(DateHelpers.convert(4, 'day', 'hour')).toBe(96);
        expect(DateHelpers.convert(28, 'day', 'week')).toBe(4);
        expect(DateHelpers.convert(3.5, 'day', 'week')).toBe(0.5);
    });

    test('min', () => {

        expect(DateHelpers.min(
            new Date('2023-12-30T13:26:15.893Z'),
            new Date('2023-12-30T13:26:15.893Z'),
        )).toStrictEqual(new Date('2023-12-30T13:26:15.893Z'));

        expect(DateHelpers.min(
            new Date('2023-12-30T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toStrictEqual(new Date('2020-12-29T13:26:15.893Z'));

        expect(DateHelpers.min(
            new Date('2020-12-30T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toStrictEqual(new Date('2020-12-29T13:26:15.893Z'));

        expect(DateHelpers.min(
            new Date('2020-12-29T13:26:16.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toStrictEqual(new Date('2020-12-29T13:26:15.893Z'));

        expect(DateHelpers.min(
            new Date('2020-12-29T13:26:16.893Z'),
            new Date('2024-12-29T13:26:15.893Z'),
        )).toStrictEqual(new Date('2020-12-29T13:26:16.893Z'));
    });

    test('max', () => {

        expect(DateHelpers.max(
            new Date('2023-12-30T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toStrictEqual(new Date('2023-12-30T13:26:15.893Z'));

        expect(DateHelpers.max(
            new Date('2020-12-30T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toStrictEqual(new Date('2020-12-30T13:26:15.893Z'));

        expect(DateHelpers.max(
            new Date('2020-12-29T13:26:16.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toStrictEqual(new Date('2020-12-29T13:26:16.893Z'));

        expect(DateHelpers.max(
            new Date('2020-12-29T13:26:16.893Z'),
            new Date('2024-12-29T13:26:15.893Z'),
        )).toStrictEqual(new Date('2024-12-29T13:26:15.893Z'));
    });

    test('Period.forward', () => {
        const now = new Date('2020-12-22T16:16:18.774Z');

        expect(() => DateHelpers.Period.forward(
            { amount: 1, granularity: 'year' },
            null as any
        )).toThrow();

        const aYearFromNow = new Date();
        aYearFromNow.setFullYear(aYearFromNow.getFullYear() + 1);
        aYearFromNow.setMilliseconds(0);
        const forwardResult = DateHelpers.Period.forward({ amount: 1, granularity: 'year' });
        forwardResult.setMilliseconds(0);
        expect(forwardResult).toStrictEqual(aYearFromNow);

        expect(DateHelpers.Period.forward(
            { amount: 1, granularity: 'year' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, 1, 'year'));

        expect(DateHelpers.Period.forward(
            { amount: 5, granularity: 'month' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, 5, 'month'));

        expect(DateHelpers.Period.forward(
            { amount: 12, granularity: 'week' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, 12, 'week'));

        expect(DateHelpers.Period.forward(
            { amount: 99, granularity: 'day' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, 99, 'day'));

        expect(DateHelpers.Period.forward(
            { amount: 24, granularity: 'hour' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, 24, 'hour'));

        expect(DateHelpers.Period.forward(
            { amount: 60, granularity: 'minute' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, 60, 'minute'));

        expect(DateHelpers.Period.forward(
            { amount: 630, granularity: 'second' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, 630, 'second'));

        expect(DateHelpers.Period.forward(
            { amount: 2, granularity: 'millisecond' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, 2, 'millisecond'));
    });

    test('Period.backward', () => {
        const now = new Date('2020-12-22T16:16:18.774Z');

        const aYearAgo = new Date();
        aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);
        aYearAgo.setMilliseconds(0);
        const backwardResult = DateHelpers.Period.backward({ amount: 1, granularity: 'year' });
        backwardResult.setMilliseconds(0);
        expect(backwardResult).toStrictEqual(aYearAgo);

        expect(DateHelpers.Period.backward(
            { amount: 1, granularity: 'year' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, -1, 'year'));

        expect(DateHelpers.Period.backward(
            { amount: 5, granularity: 'month' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, -5, 'month'));

        expect(DateHelpers.Period.backward(
            { amount: 12, granularity: 'week' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, -12, 'week'));

        expect(DateHelpers.Period.backward(
            { amount: 99, granularity: 'day' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, -99, 'day'));

        expect(DateHelpers.Period.backward(
            { amount: 24, granularity: 'hour' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, -24, 'hour'));

        expect(DateHelpers.Period.backward(
            { amount: 60, granularity: 'minute' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, -60, 'minute'));

        expect(DateHelpers.Period.backward(
            { amount: 630, granularity: 'second' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, -630, 'second'));

        expect(DateHelpers.Period.backward(
            { amount: 2, granularity: 'millisecond' },
            now
        )).toStrictEqual(DateHelpers.shiftDate(now, -2, 'millisecond'));

    });

    test('Period.toMs', () => {
        const now = new Date(2021, 0, 11, 11, 11);

        expect(DateHelpers.Period.toMs({ amount: 1, granularity: 'year' }, now)).toBe(31622400000);

        expect(DateHelpers.Period.toMs({ amount: 4.5, granularity: 'month' }, now)).toBe(10540800000);

        expect(DateHelpers.Period.toMs({ amount: 3, granularity: 'week' }, now)).toBe(1814400000);

        expect(DateHelpers.Period.toMs({ amount: 70, granularity: 'day' }, now)).toBe(6048000000);

        expect(DateHelpers.Period.toMs({ amount: 12, granularity: 'hour' }, now)).toBe(43200000);

        expect(DateHelpers.Period.toMs({ amount: 58, granularity: 'minute' }, now)).toBe(3480000);

        expect(DateHelpers.Period.toMs({ amount: 84, granularity: 'second' }, now)).toBe(84000);

        expect(DateHelpers.Period.toMs({ amount: 999, granularity: 'millisecond' }, now)).toBe(999);
    });

    test('Period.format', () => {

        expect(DateHelpers.Period.format({ amount: 2, granularity: 'year' })).toBe('2 years');
        expect(DateHelpers.Period.format({ amount: 1, granularity: 'year' })).toBe('1 year');

        expect(DateHelpers.Period.format({ amount: 3, granularity: 'month' })).toBe('3 months');
        expect(DateHelpers.Period.format({ amount: 1, granularity: 'month' })).toBe('1 month');

        expect(DateHelpers.Period.format({ amount: 343, granularity: 'week' })).toBe('343 weeks');
        expect(DateHelpers.Period.format({ amount: 1, granularity: 'week' })).toBe('1 week');

        expect(DateHelpers.Period.format({ amount: 101, granularity: 'day' })).toBe('101 days');
        expect(DateHelpers.Period.format({ amount: 1, granularity: 'day' })).toBe('1 day');

        expect(DateHelpers.Period.format({ amount: 3244, granularity: 'hour' })).toBe('3244 hours');
        expect(DateHelpers.Period.format({ amount: 1, granularity: 'hour' })).toBe('1 hour');

        expect(DateHelpers.Period.format({ amount: 878, granularity: 'minute' })).toBe('878 minutes');
        expect(DateHelpers.Period.format({ amount: 1, granularity: 'minute' })).toBe('1 minute');

        expect(DateHelpers.Period.format({ amount: 7, granularity: 'second' })).toBe('7 seconds');
        expect(DateHelpers.Period.format({ amount: 1, granularity: 'second' })).toBe('1 second');

        expect(DateHelpers.Period.format({ amount: 78, granularity: 'millisecond' })).toBe('78 milliseconds');
        expect(DateHelpers.Period.format({ amount: 1, granularity: 'millisecond' })).toBe('1 millisecond');
    });

    test('YearDate.isValid', () => {

        expect(DateHelpers.YearDate.isValid({ day: 12, month: 12 })).toBeTruthy();
        expect(DateHelpers.YearDate.isValid({ day: 1, month: 31 })).toBeTruthy();
        expect(DateHelpers.YearDate.isValid({ day: 132, month: 31 })).toBeTruthy();
        expect(DateHelpers.YearDate.isValid({ day: 14234, month: 31333 })).toBeTruthy();
    });

    test('YearDate.toDate', () => {
        const currentYear = new Date().getFullYear();
        expect(DateHelpers.YearDate.toDate({ day: 30, month: 12 }, 2020)).toStrictEqual(new Date('2021-01-30T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate({ day: 1, month: 31 }, 2021)).toStrictEqual(new Date('2023-08-01T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate({ day: 14, month: 7 }, 2020)).toStrictEqual(new Date('2020-08-14T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate({ day: 6, month: 3 }, 2022)).toStrictEqual(new Date('2022-04-06T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate(undefined as any, 2022)).toBeNull();
        expect(DateHelpers.YearDate.toDate({ day: null, month: null }, 2019)).toStrictEqual(new Date('2019-01-01T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate({ day: null, month: null }, undefined)).toStrictEqual(new Date(`${currentYear}-01-01T12:00:00.000Z`));
    });

    test('YearDate.equals', () => {
        expect(DateHelpers.YearDate.equals({ day: null, month: null }, { day: null, month: null })).toBeTruthy();
        expect(DateHelpers.YearDate.equals(undefined as any, { day: 12, month: 12 })).toBeFalsy();
        expect(DateHelpers.YearDate.equals(undefined as any, undefined as any)).toBeTruthy();
        expect(DateHelpers.YearDate.equals({ day: 12, month: 12 }, { day: 12, month: 12 })).toBeTruthy();
        expect(DateHelpers.YearDate.equals({ day: 1, month: 31 }, { day: 30, month: 12 })).toBeFalsy();
        expect(DateHelpers.YearDate.equals({ day: 4, month: 4 }, { day: 4, month: 4 })).toBeTruthy();
        expect(DateHelpers.YearDate.equals({ day: 434, month: 434 }, { day: 434, month: 434 })).toBeTruthy();
    });

    test('YearDate.fromDate', () => {

        expect(DateHelpers.YearDate.fromDate(new Date('2021-01-30T12:00:00.000Z'))).toStrictEqual({ day: 30, month: 0 });
        expect(DateHelpers.YearDate.fromDate(new Date('2022-12-09T00:00:00.000Z'))).toStrictEqual({ day: 9, month: 11 });
        expect(DateHelpers.YearDate.fromDate(new Date('2021-01-01T12:00:00.000Z'))).toStrictEqual({ day: 1, month: 0 });
        expect(DateHelpers.YearDate.fromDate(new Date('2021-12-31T12:00:00.000Z'))).toStrictEqual({ day: 31, month: 11 });
        expect(DateHelpers.YearDate.fromDate(new Date('2021-14-31T12:00:00.000Z'))).toStrictEqual({ day: NaN, month: NaN });
    });

    test('YearDate.matches', () => {

        expect(DateHelpers.YearDate.matches({ month: 11, day: 12 }, new Date('2020-12-12T12:00:00.000Z'), false)).toBeTruthy();
        expect(DateHelpers.YearDate.matches({ month: 11, day: 12 }, new Date('2020-12-12T12:00:00.000Z'), true)).toBeTruthy();
        expect(DateHelpers.YearDate.matches({ month: 10, day: 22 }, new Date('2020-11-22T12:00:00.000Z'), true)).toBeTruthy();
        expect(DateHelpers.YearDate.matches({ month: 12, day: 12 }, new Date('2020-12-12T12:00:00.000Z'), false)).toBeFalsy();
        expect(DateHelpers.YearDate.matches({ month: 10, day: 22 }, new Date('2020-10-22T12:00:00.000Z'), true)).toBeFalsy();
        expect(DateHelpers.YearDate.matches(undefined as any, new Date('2020-10-22T12:00:00.000Z'), true)).toBeFalsy();
        expect(DateHelpers.YearDate.matches(undefined as any, new Date('2020-10-22T12:00:00.000Z'), false)).toBeFalsy();
        expect(DateHelpers.YearDate.matches({ month: null, day: null }, new Date('2020-12-12T12:00:00.000Z'), true)).toBeFalsy();
        expect(DateHelpers.YearDate.matches({ month: null, day: null }, new Date('2020-12-12T12:00:00.000Z'))).toBeFalsy();
        expect(DateHelpers.YearDate.matches({ month: undefined as any, day: undefined as any }, new Date('2020-12-12T12:00:00.000Z'), true)).toBeFalsy();
        expect(DateHelpers.YearDate.matches({ month: undefined as any, day: undefined as any }, new Date('2020-12-12T12:00:00.000Z'))).toBeFalsy();
        expect(() => DateHelpers.YearDate.matches({ month: null, day: null }, undefined as any)).toThrow();
        expect(() => DateHelpers.YearDate.matches({ month: null, day: null }, undefined as any, true)).toThrow();
        expect(() => DateHelpers.YearDate.matches(undefined as any, undefined as any)).toThrow();
    });

    test('getTime', () => {
        expect(DateHelpers.getTime(new Date('2020-11-29T13:26:15.893Z'))).toBe(1606656375893);
        expect(DateHelpers.getTime(new Date('2020-09-19T00:00:00.893Z'))).toBe(1600473600893);
        expect(DateHelpers.getTime(new Date('2020-06-09T23:59:59.893Z'))).toBe(1591747199893);

        expect(DateHelpers.getTime(null as any)).toBe(null);
        expect(DateHelpers.getTime('1591747199893')).toBe(1591747199893);
        expect(DateHelpers.getTime('2020-06-09T23:59:59.893Z')).toBe(1591747199893);
        expect(DateHelpers.getTime(1591747199893)).toBe(1591747199893);
    });

    test('getDate', () => {

        expect(DateHelpers.getDate(1591747199893)).toStrictEqual(new Date('2020-06-09T23:59:59.893Z'));
        expect(DateHelpers.getDate('1591747199893')).toStrictEqual(new Date('2020-06-09T23:59:59.893Z'));

        expect(DateHelpers.getDate(new Date('2020-11-29T13:26:15.893Z'))).toStrictEqual(new Date('2020-11-29T13:26:15.893Z'));
        expect(DateHelpers.getDate(1600473600893)).toStrictEqual(new Date('2020-09-19T00:00:00.893Z'));
        expect(DateHelpers.getDate(undefined)).toBeNull();
    });

    test('contains', () => {

        expect(DateHelpers.contains(
            new Date('2020-01-01T00:00:00.000Z'),
            new Date('2020-12-31T23:59:59.000Z'),
            new Date('2020-07-29T13:26:15.893Z'),
            'year',
        )).toBeTruthy();

        expect(DateHelpers.contains(
            new Date('2020-01-01T00:00:00.000Z'),
            new Date('2020-12-31T23:59:59.000Z'),
            new Date('2021-07-29T13:26:15.893Z'),
            'year',
        )).toBeFalsy();

        expect(DateHelpers.contains(
            new Date('2020-01-01T00:00:00.000Z'),
            new Date('2020-02-31T23:59:59.000Z'),
            new Date('2020-02-29T13:26:15.893Z'),
            'month',
        )).toBeTruthy();

        expect(DateHelpers.contains(
            new Date('2020-01-01T00:00:00.000Z'),
            new Date('2020-02-20T23:59:59.000Z'),
            new Date('2020-03-29T13:26:15.893Z'),
            'month',
        )).toBeFalsy();

        expect(DateHelpers.contains(
            new Date('2020-01-01T00:00:00.000Z'),
            new Date('2020-01-28T23:59:59.000Z'),
            new Date('2020-01-04T13:26:15.000Z'),
            'week',
        )).toBeTruthy();

        expect(DateHelpers.contains(
            new Date('2020-01-01T00:00:00.000Z'),
            new Date('2020-01-20T23:59:59.000Z'),
            new Date('2020-01-29T13:26:15.893Z'),
            'week',
        )).toBeFalsy();

        expect(DateHelpers.contains(
            new Date('2020-01-01T00:00:00.000Z'),
            new Date('2020-01-20T23:59:59.000Z'),
            new Date('2020-01-17T13:26:15.893Z'),
            'day',
        )).toBeTruthy();

        expect(DateHelpers.contains(
            new Date('2020-01-01T00:00:00.000Z'),
            new Date('2020-01-20T23:59:59.000Z'),
            new Date('2020-01-21T13:26:15.893Z'),
            'day',
        )).toBeFalsy();

        expect(DateHelpers.contains(
            new Date('2020-01-20T00:00:00.000Z'),
            new Date('2020-01-20T23:59:59.000Z'),
            new Date('2020-01-20T13:26:15.893Z'),
            'hour',
        )).toBeTruthy();

        expect(DateHelpers.contains(
            new Date('2020-01-20T00:00:00.000Z'),
            new Date('2020-01-20T21:00:00.000Z'),
            new Date('2020-01-20T23:26:15.893Z'),
            'hour',
        )).toBeFalsy();

        expect(DateHelpers.contains(
            new Date('2020-01-20T23:00:00.000Z'),
            new Date('2020-01-20T23:30:00.000Z'),
            new Date('2020-01-20T23:26:15.893Z'),
            'minute',
        )).toBeTruthy();

        expect(DateHelpers.contains(
            new Date('2020-01-20T23:00:00.000Z'),
            new Date('2020-01-20T23:30:00.000Z'),
            new Date('2020-01-20T23:36:15.893Z'),
            'minute',
        )).toBeFalsy();

        expect(DateHelpers.contains(
            new Date('2020-01-20T23:30:00.000Z'),
            new Date('2020-01-20T23:30:30.000Z'),
            new Date('2020-01-20T23:30:15.893Z'),
            'second',
        )).toBeTruthy();

        expect(DateHelpers.contains(
            new Date('2020-01-20T23:30:00.000Z'),
            new Date('2020-01-20T23:30:30.000Z'),
            new Date('2020-01-20T23:30:35.893Z'),
            'second',
        )).toBeFalsy();

        expect(DateHelpers.contains(
            new Date('2020-01-20T23:30:00.000Z'),
            new Date('2020-01-20T23:30:00.999Z'),
            new Date('2020-01-20T23:30:00.893Z'),
            'millisecond',
        )).toBeTruthy();

        expect(DateHelpers.contains(
            new Date('2020-01-20T23:30:00.000Z'),
            new Date('2020-01-20T23:30:00.500Z'),
            new Date('2020-01-20T23:30:00.893Z'),
            'millisecond',
        )).toBeFalsy();

        expect(DateHelpers.contains(
            new Date('2020-01-20T23:30:00.000Z'),
            new Date('2020-01-20T23:30:00.500Z'),
            new Date('2020-01-20T23:30:00.893Z'),
        )).toBeTruthy();
    });

    test('Parse.fromDatePicker', () => {

        expect(DateHelpers.Parse.fromDatePicker('2020-07-29T13:26:15.893Z')).toStrictEqual(new Date('2020-07-29T13:26:15.893Z'));
        expect(DateHelpers.Parse.fromDatePicker('2020-07-29T13:26:15.893Z', true)).toStrictEqual(new Date('2020-07-29T13:26:15.893Z'));
    });

    test('Parse.toDistance', () => {

        expect(() => DateHelpers.Format.toDistance(undefined as any, new Date('2020-07-29T10:27:15.893Z'))).toThrow();
        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), undefined)).toMatch(/weeks ago/);

        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-07-29T10:27:15.893Z'))).toBe('Today');

        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-06-29T10:26:15.893Z'))).toBe('In 4 weeks');
        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-07-28T10:26:15.893Z'))).toBe('Tomorrow');
        expect(DateHelpers.Format.toDistance(new Date('2020-08-01T10:26:15.893Z'), new Date('2020-07-28T10:26:15.893Z'))).toBe('In 4 days');
        expect(DateHelpers.Format.toDistance(new Date('2020-08-04T10:26:15.893Z'), new Date('2020-07-28T10:26:15.893Z'))).toBe('In a week');

        expect(DateHelpers.Format.toDistance(new Date('2020-06-29T10:26:15.893Z'), new Date('2020-07-29T10:26:15.893Z'))).toBe('4 weeks ago');
        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-07-30T10:26:15.893Z'))).toBe('Yesterday');
        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-08-01T10:26:15.893Z'))).toBe('3 days ago');
        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-08-05T10:26:15.893Z'))).toBe('Week ago');
    });

    test('clamp', () => {

        expect(DateHelpers.clamp(
            new Date('2020-05-29T10:26:15.893Z'),
            new Date('2020-07-29T09:54:43.555Z'),
            new Date('2020-08-03T18:10:53.101Z')))
        .toStrictEqual(new Date('2020-07-29T09:54:43.555Z'));

        expect(DateHelpers.clamp(
            new Date('2020-07-29T10:26:15.893Z'),
            new Date('2020-07-29T09:54:43.555Z'),
            new Date('2020-07-03T18:10:53.101Z')))
        .toStrictEqual(new Date('2020-07-03T18:10:53.101Z'));

        expect(DateHelpers.clamp(
            new Date('2020-07-29T10:26:15.893Z'),
            new Date('2020-07-29T10:26:15.893Z'),
            new Date('2020-07-29T10:26:15.893Z')))
        .toStrictEqual(new Date('2020-07-29T10:26:15.893Z'));
    });

    test('timespan', () => {

        expect(DateHelpers.Format.timespan(10012030)).toBe('2h 46m 52s');
        expect(DateHelpers.Format.timespan(100129)).toBe('1m 40s');
        expect(DateHelpers.Format.timespan(10129)).toBe('10s');

        expect(DateHelpers.Format.timespan(10912939, true)).toBe('3h 1m 53s');
        expect(DateHelpers.Format.timespan(100129, true)).toBe('1m 40s');
        expect(DateHelpers.Format.timespan(10129, true)).toBe('10s');
    });

    test('decompose', () => {

        expect(DateHelpers.decompose(
            new Date('2020-05-29T10:26:15.893Z'),
            true,
            'day', 'hour', 'minute', 'second'
        )).toStrictEqual({ day: 18411, hour: 10, minute: 26, second: 16 });

        expect(DateHelpers.decompose(
            new Date('2020-05-29T10:26:15.893Z'),
            false,
            'day', 'hour', 'minute', 'second'
        )).toStrictEqual({ day: 18411, hour: 10, minute: 26, second: 16 });

        expect(DateHelpers.decompose(
            new Date('2020-08-01T10:26:15.893Z'),
            false,
            'hour', 'minute', 'second'
        )).toStrictEqual({ hour: 443410, minute: 26, second: 16 });

        expect(DateHelpers.decompose(
            new Date('2020-01-01T00:00:00.000Z'),
            false,
            'day', 'hour', 'minute', 'second'
        )).toStrictEqual({ day: 18262, hour: 0, minute: 0, second: 0 });

        expect(DateHelpers.decompose(
            new Date('2020-12-31T23:59:59.999Z'),
            false,
            'day', 'hour', 'minute', 'second'
        )).toStrictEqual({ day: 18628, hour: 0, minute: 0, second: 0 });

        expect(DateHelpers.decompose(
            new Date('2020-12-31T23:59:59.000Z'),
            false,
            'day', 'hour', 'minute', 'second'
        )).toStrictEqual({ day: 18627, hour: 23, minute: 59, second: 59 });
    });

    test('decomposeMs', () => {

        expect(DateHelpers.decomposeMs(
            new Date('2020-12-31T23:59:59.000Z').getTime() - new Date('2020-01-01T00:00:00.001Z').getTime(),
            'week', 'day'
        )).toStrictEqual({ week: 53, day: 1 });

        expect(DateHelpers.decomposeMs(
            new Date('2020-12-31T23:59:59.000Z').getTime(),
            'hour', 'minute', 'second'
        )).toStrictEqual({ hour: 447071, minute: 59, second: 59 });

        expect(DateHelpers.decomposeMs(
            new Date('2020-12-31T00:00:00.000Z').getTime(),
            'day', 'hour', 'minute', 'second'
        )).toStrictEqual({ day: 18627, hour: 0, minute: 0, second: 0 });

        expect(DateHelpers.decomposeMs(
            new Date('2020-12-31T23:32:12.000Z').getTime(),
            'second'
        )).toStrictEqual({ second: 1609457532 });

        expect(DateHelpers.decomposeMs(
            new Date('2020-12-31T23:32:12.000Z').getTime(),
            'hour'
        )).toStrictEqual({ hour: 447071 });
    });

    test('decomposeDate', () => {

        expect(DateHelpers.decomposeDate(
            new Date('2020-01-01T00:00:00.000Z'),
            false,
            'month', 'day', 'hour', 'minute', 'second'
        )).toStrictEqual({ month: 1, day: 1, hour: 0, minute: 0, second: 0 });

        expect(DateHelpers.decomposeDate(
            new Date('2020-12-31T23:59:59.000Z'),
            false,
            'week', 'day', 'hour', 'minute', 'second'
        )).toStrictEqual({ day: 31, hour: 23, minute: 59, second: 59, week: 53 });

        expect(DateHelpers.decomposeDate(
            new Date('2020-08-04T10:26:15.893Z'),
            false,
            'hour', 'minute', 'second'
        )).toStrictEqual({ hour: 10, minute: 26, second: 15 });
    });

    test('addDays', () => {
        const baseDate = new Date('2020-08-12T10:26:15.893Z');
        expect(DateHelpers.addDays(baseDate, 12, e => e === e)).toStrictEqual(new Date('2020-08-24T10:26:15.893Z'));
        expect(DateHelpers.addDays(baseDate, 12, e => e === e, 3)).toStrictEqual(new Date('2020-08-15T10:26:15.893Z'));
        expect(DateHelpers.addDays(baseDate, 16, e => e === e, 37)).toStrictEqual(new Date('2020-08-28T10:26:15.893Z'));
        expect(DateHelpers.addDays(baseDate, 16, e => e === new Date('2030-08-12T10:26:15.893Z'), 37)).toStrictEqual(new Date('2020-09-18T10:26:15.893Z'));
    });

    test('splitDatesByDay', () => {

        expect(DateHelpers.splitDatesByDay(
            [1608739206000, 1608732006000, 1608764406000, 1606950006000, 1606952706000, 1608767999000, 1608681600000]
        )).toStrictEqual([[1606950006000, 1606950006000], [1608681600000, 1608681600000, 1608681600000, 1608681600000, 1608681600000]]);

        expect(DateHelpers.splitDatesByDay(
            [1608681600000, 1608685200000, 1608688800000, 1608692400000, 1608696000000, 1608699600000, 1608681600000, 1608728159000]
        )).toStrictEqual([[1608681600000, 1608681600000, 1608681600000, 1608681600000, 1608681600000, 1608681600000, 1608681600000, 1608681600000]]);

        expect(DateHelpers.splitDatesByDay(undefined as any)).toStrictEqual([]);
    });

    test('getDaysStreak', () => {

        const getDayWithOffset = (offset: number) => new Date().setDate(new Date().getDate() + offset);

        expect(DateHelpers.getDaysStreak(
            [getDayWithOffset(0), getDayWithOffset(1), getDayWithOffset(2), getDayWithOffset(3), getDayWithOffset(4), getDayWithOffset(5)],
            false
        )).toBe(6);

        expect(DateHelpers.getDaysStreak(
            [getDayWithOffset(0), getDayWithOffset(-1), getDayWithOffset(-2), getDayWithOffset(-3), getDayWithOffset(-4), getDayWithOffset(-5)],
            true
        )).toBe(6);

        expect(DateHelpers.getDaysStreak(
            [getDayWithOffset(1), getDayWithOffset(2), getDayWithOffset(5), getDayWithOffset(6), getDayWithOffset(7)],
            false
        )).toBe(2);

        expect(DateHelpers.getDaysStreak(
            [getDayWithOffset(3), getDayWithOffset(4), getDayWithOffset(5), getDayWithOffset(6), getDayWithOffset(7)],
            false
        )).toBe(0);

        expect(DateHelpers.getDaysStreak(
            [],
            false
        )).toBe(0);
    });

    test('DateX.get', () => {
        const baseDate = () => new Date('2020-08-12T10:26:15.893Z');
        expect(DateHelpers.DateX.get(baseDate(), 'millisecond', false)).toBe(893);
        expect(DateHelpers.DateX.get(baseDate(), 'second', false)).toBe(15);
        expect(DateHelpers.DateX.get(baseDate(), 'minute', false)).toBe(26);
        expect(DateHelpers.DateX.get(baseDate(), 'hour', false)).toBe(10);
        expect(DateHelpers.DateX.get(baseDate(), 'day', false)).toBe(12);
        expect(DateHelpers.DateX.get(baseDate(), 'month', false)).toBe(7);
        expect(DateHelpers.DateX.get(baseDate(), 'year', false)).toBe(2020);

        expect(DateHelpers.DateX.get(baseDate(), 'week', false)).toBe(33);
        expect(DateHelpers.DateX.get(new Date('2020-01-01'), 'week', false)).toBe(1);
        expect(DateHelpers.DateX.get(new Date('2020-01-04T23:59:59.999Z'), 'week', false)).toBe(1);
        expect(DateHelpers.DateX.get(new Date('2020-01-05T00:00:00.000Z'), 'week', false)).toBe(2);
        expect(DateHelpers.DateX.get(new Date('2020-01-07'), 'week', false)).toBe(2);
        expect(DateHelpers.DateX.get(new Date('2020-01-10'), 'week', false)).toBe(2);
        expect(DateHelpers.DateX.get(new Date('2020-01-12'), 'week', false)).toBe(3);

        expect(DateHelpers.DateX.get(new Date('2020-01-01'), 'week', false)).toBe(1);
        expect(DateHelpers.DateX.get(new Date('2021-01-01'), 'week', false)).toBe(1);
        expect(DateHelpers.DateX.get(new Date('2022-01-01'), 'week', false)).toBe(1);
        expect(DateHelpers.DateX.get(new Date('2023-01-01'), 'week', false)).toBe(1);
        expect(DateHelpers.DateX.get(new Date('2023-12-25'), 'week', false)).toBe(52);
        expect(DateHelpers.DateX.get(new Date('2023-12-26'), 'week', false)).toBe(52);
        expect(DateHelpers.DateX.get(new Date('2023-12-30'), 'week', false)).toBe(52);
        expect(DateHelpers.DateX.get(new Date('2023-12-31'), 'week', false)).toBe(53); // it is Sunday here, so counted as next week
        expect(DateHelpers.DateX.get(new Date('2024-01-01'), 'week', false)).toBe(1);

        expect(DateHelpers.DateX.get(baseDate(), 'millisecond', true)).toBe(893);
        expect(DateHelpers.DateX.get(baseDate(), 'second', true)).toBe(15);
        expect(DateHelpers.DateX.get(baseDate(), 'minute', true)).toBe(26);
        expect(DateHelpers.DateX.get(baseDate(), 'hour', true)).toBe(10);
        expect(DateHelpers.DateX.get(baseDate(), 'day', true)).toBe(12);
        expect(DateHelpers.DateX.get(baseDate(), 'month', true)).toBe(7);
        expect(DateHelpers.DateX.get(baseDate(), 'year', true)).toBe(2020);

        expect(DateHelpers.DateX.get(baseDate(), 'week', true)).toBe(33);

        expect(() => DateHelpers.DateX.get(undefined as any, 'day', false)).toThrow();
        expect(DateHelpers.DateX.get(baseDate(), undefined as any, false)).toBe(1597227975893);
        expect(DateHelpers.DateX.get(baseDate(), 'day', undefined as any)).toBe(12);
    });

    test('DateX.set', () => {
        const baseDate = () => new Date('2020-08-12T10:26:15.893Z');

        expect(DateHelpers.DateX.set(baseDate(), 'year', true, 2018)).toBe(1534069575893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018)).toBe(1534069575893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018, 11)).toBe(1544610375893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018, 11, 1)).toBe(1543659975893);

        expect(() => DateHelpers.DateX.set(undefined as any, 'year', false, 2018)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined as any, false, 2018)).toBe(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', undefined as any, 2018)).toBe(1534069575893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, undefined as any)).toBeNaN();
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018, undefined)).toBeNaN();
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018, 11, undefined)).toBeNaN();

        expect(DateHelpers.DateX.set(baseDate(), 'month', false, 3)).toBe(1586687175893);
        expect(DateHelpers.DateX.set(baseDate(), 'month', false, 3, 0)).toBe(1585650375893);

        expect(() => DateHelpers.DateX.set(undefined as any, 'month', false, 3)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined as any, false, 3)).toBe(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'month', undefined as any, 3)).toBe(1586687175893);
        expect(DateHelpers.DateX.set(baseDate(), 'month', false, undefined as any)).toBeNaN();

        expect(DateHelpers.DateX.set(baseDate(), 'week', false, 40)).toBe(new Date('2020-09-30T10:26:15.893Z').getTime());

        expect(DateHelpers.DateX.set(baseDate(), 'day', false, 1)).toBe(1596277575893);

        expect(() => DateHelpers.DateX.set(undefined as any, 'day', false, 1)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined as any, false, 1)).toBe(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'day', undefined as any, 1)).toBe(1596277575893);
        expect(DateHelpers.DateX.set(baseDate(), 'day', false, undefined as any)).toBeNaN();

        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12)).toBe(1597235175893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30)).toBe(1597235415893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30, 30)).toBe(1597235430893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30, 30, 555)).toBe(1597235430555);

        expect(() => DateHelpers.DateX.set(undefined as any, 'hour', false, 12)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined as any, false, 12)).toBe(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', undefined as any, 12)).toBe(1597235175893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, undefined as any)).toBeNaN();
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, undefined)).toBeNaN();
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30, undefined)).toBeNaN();
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30, 30, undefined)).toBeNaN();

        expect(DateHelpers.DateX.set(baseDate(), 'minute', true, 30)).toBe(1597228215893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30)).toBe(1597228215893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30, 30)).toBe(1597228230893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30, 30, 555)).toBe(1597228230555);

        expect(() => DateHelpers.DateX.set(undefined as any, 'minute', false, 30)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined as any, false, 30)).toBe(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', undefined as any, 30)).toBe(1597228215893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, undefined as any)).toBeNaN();
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30, undefined)).toBeNaN();
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30, 30, undefined)).toBeNaN();

        expect(DateHelpers.DateX.set(baseDate(), 'second', true, 30)).toBe(1597227990893);
        expect(DateHelpers.DateX.set(baseDate(), 'second', false, 30)).toBe(1597227990893);
        expect(DateHelpers.DateX.set(baseDate(), 'second', false, 30, 555)).toBe(1597227990555);

        expect(() => DateHelpers.DateX.set(undefined as any, 'second', false, 30)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined as any, false, 30)).toBe(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'second', undefined as any, 30)).toBe(1597227990893);
        expect(DateHelpers.DateX.set(baseDate(), 'second', false, undefined as any)).toBeNaN();
        expect(DateHelpers.DateX.set(baseDate(), 'second', false, 30, undefined as any)).toBeNaN();

        expect(DateHelpers.DateX.set(baseDate(), 'millisecond', false, 300)).toBe(1597227975300);
        expect(DateHelpers.DateX.set(baseDate(), 'millisecond', true, 300)).toBe(1597227975300);

        expect(() => DateHelpers.DateX.set(undefined as any, 'millisecond', false, 30)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined as any, false, 300)).toBe(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'millisecond', undefined as any, 300)).toBe(1597227975300);
        expect(DateHelpers.DateX.set(baseDate(), 'millisecond', false, undefined as any)).toBeNaN();
    });

    test('ensureDates', () => {

        type TestEnsureDates = {
            date: Date;
            start: Date;
            end: Date;
        };

        const testEnsureDatesNullValues: TestEnsureDates = {
            date: null as any,
            start: null as any,
            end: null as any,
        };

        const testEnsureDatesValidDates: TestEnsureDates = {
            date: new Date('2020-08-12T10:26:15.000Z'),
            start: new Date('2020-05-09T11:02:55.000Z'),
            end: new Date('2020-11-23T12:34:56.000Z'),
        };

        const testEnsureDatesStringDates: TestEnsureDates = {
            date: '2020-08-12T10:26:15.000Z' as any,
            start: '2020-05-09T11:02:55.000Z' as any,
            end: '2020-11-23T12:34:56.000Z' as any,
        };

        const testEnsureDatesUnixDates: TestEnsureDates = {
            date: 1597227975000 as any,
            start: 1589022175000 as any,
            end: 1606134896000 as any,
        };

        const baseExpectedResult = {
            date: new Date('2020-08-12T10:26:15.000Z'),
            end: new Date('2020-11-23T12:34:56.000Z'),
            start: new Date('2020-05-09T11:02:55.000Z'),
        };

        DateHelpers.ensureDates(testEnsureDatesNullValues, 'start', 'end', 'date');
        expect(testEnsureDatesNullValues).toStrictEqual({ date: null, end: null, start: null });

        DateHelpers.ensureDates(testEnsureDatesValidDates, 'start', 'end', 'date');
        expect(testEnsureDatesValidDates).toStrictEqual(baseExpectedResult);

        DateHelpers.ensureDates(testEnsureDatesStringDates, 'start', 'end', 'date');
        expect(testEnsureDatesStringDates).toStrictEqual(baseExpectedResult);

        DateHelpers.ensureDates(testEnsureDatesUnixDates, 'start', 'end', 'date');
        expect(testEnsureDatesUnixDates).toStrictEqual(baseExpectedResult);

        const empty = undefined;
        DateHelpers.ensureDates(undefined as any, 'start', 'end', 'date');
        expect(empty).toBeUndefined();
    });

    test('setDayOfWeek', () => {
        const baseDate = () => new Date('2023-11-09'); // day == 4
        // const convert = (d: number, future: boolean | null = null) => DateHelpers.setDayOfWeek(baseDate(), d, future).getDay();

        expect(DateHelpers.setDayOfWeek(baseDate(), 0)).toStrictEqual(new Date('2023-11-05'));
        expect(DateHelpers.setDayOfWeek(baseDate(), 1)).toStrictEqual(new Date('2023-11-06'));
        expect(DateHelpers.setDayOfWeek(baseDate(), 2)).toStrictEqual(new Date('2023-11-07'));
        expect(DateHelpers.setDayOfWeek(baseDate(), 6)).toStrictEqual(new Date('2023-11-11'));
        expect(DateHelpers.setDayOfWeek(baseDate(), 13)).toStrictEqual(new Date('2023-11-18'));
        expect(DateHelpers.setDayOfWeek(baseDate(), 2, true)).toStrictEqual(new Date('2023-11-14'));
        expect(DateHelpers.setDayOfWeek(baseDate(), 9, true)).toStrictEqual(new Date('2023-11-14'));
        expect(DateHelpers.setDayOfWeek(baseDate(), -1, false)).toStrictEqual(new Date('2023-11-04'));
    });
});
