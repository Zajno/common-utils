import * as DateHelpers from '../dateHelpers';
import { Granularity } from '../dateHelpers';

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

        expect(DateHelpers.add(now, 1, 'day')).toStrictEqual(new Date('2020-11-10T15:22:08.959Z'));
        expect(DateHelpers.add(now, -1, 'day')).toStrictEqual(new Date('2020-11-08T15:22:08.959Z'));

    });

    test('Format.toDistance', () => {
        const from = new Date('2020-11-09T15:22:08.959Z');

        expect(DateHelpers.Format.toDistance(from, undefined)).toMatch(/weeks ago/);
        expect(DateHelpers.Format.toDistance(from, null)).toMatch(/weeks ago/);

        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 5, 'hour'), from)).toStrictEqual('Today');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 16, 'hour'), from)).toStrictEqual('Tomorrow');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 1, 'day'), from)).toStrictEqual('Tomorrow');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 2, 'day'), from)).toStrictEqual('In 2 days');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 6, 'day'), from)).toStrictEqual('In 6 days');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 7, 'day'), from)).toStrictEqual('In a week');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 8, 'day'), from)).toStrictEqual('In a week');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 13, 'day'), from)).toStrictEqual('In a week');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, 2, 'week'), from)).toStrictEqual('In 2 weeks');

        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -5, 'hour'), from)).toStrictEqual('Today');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -16, 'hour'), from)).toStrictEqual('Yesterday');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -1, 'day'), from)).toStrictEqual('Yesterday');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -2, 'day'), from)).toStrictEqual('2 days ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -6, 'day'), from)).toStrictEqual('6 days ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -7, 'day'), from)).toStrictEqual('Week ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -8, 'day'), from)).toStrictEqual('Week ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -13, 'day'), from)).toStrictEqual('Week ago');
        expect(DateHelpers.Format.toDistance(DateHelpers.add(from, -2, 'week'), from)).toStrictEqual('2 weeks ago');

    });

    test('getDiscreteDiff', () => {
        const d1 = new Date('2020-11-30T13:26:15.893Z');

        expect(DateHelpers.getDiscreteDiff(d1, d1, 'day', false, false)).toStrictEqual(0);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-11-30T13:26:15.893Z'),
            'day', true, false)
        ).toStrictEqual(365);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2020-12-01T13:26:15.893Z'),
            'day')
        ).toStrictEqual(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2020-11-29T13:26:15.893Z'),
            'day')
        ).toStrictEqual(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2020-11-29T13:26:15.893Z'),
            'day', false, false)
        ).toStrictEqual(-1);

        expect(DateHelpers.getDiscreteDiff(
            new Date('2020-11-30T00:00:00.001Z'),
            new Date('2020-11-29T23:59:59.999Z'),
            'day', false, false)
        ).toStrictEqual(-1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-11-29T13:26:15.893Z'),
            'year')
        ).toStrictEqual(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-11-29T13:26:15.893Z'),
            'year', true)
        ).toStrictEqual(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-12-01T13:26:15.893Z'),
            'month')
        ).toStrictEqual(1);

        expect(DateHelpers.getDiscreteDiff(
            d1,
            new Date('2021-12-01T13:26:15.893Z'),
            'month', true)
        ).toStrictEqual(1);

        expect(() => DateHelpers.getDiscreteDiff(
            undefined,
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
            null
        )).toThrow('Unsupported granularity');
    });
    
    test('countDays', () => {

        expect(DateHelpers.countDays(
            new Date('2019-12-21T13:26:15.893Z'),
            new Date('2020-01-03T13:26:15.893Z'),
            null)
        ).toStrictEqual(14);

        expect(DateHelpers.countDays(
            new Date('2019-12-29T13:26:15.893Z'),
            new Date('2020-01-07T13:26:15.893Z'),
            DateHelpers.isNetworkDate)
        ).toStrictEqual(7);

        expect(DateHelpers.countDays(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-12-10T13:26:15.893Z'),
            null)
        ).toStrictEqual(12);

        expect(DateHelpers.countDays(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-11T13:26:15.893Z'),     
            null)
        ).toStrictEqual(1);

        expect(DateHelpers.countDays(
            new Date('2020-12-10T13:26:15.893Z'),
            new Date('2020-12-21T13:26:15.893Z'),     
            null)
        ).toStrictEqual(12);

        expect(DateHelpers.countDays(
            new Date('2020-12-10T13:26:15.893Z'),
            new Date('2020-12-21T13:26:15.893Z'),     
            DateHelpers.isNetworkDate)
        ).toStrictEqual(8);

        expect(DateHelpers.countDays(
            new Date('2020-11-29T13:26:15.893Z'),
            new Date('2020-11-11T13:26:15.893Z'),     
            DateHelpers.isNetworkDate)
        ).toStrictEqual(0);
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
            undefined,
        )).toThrow('Unsupported granularity');
    });

    test('compare', () => {

        expect(DateHelpers.compare(
            new Date('2020-12-30T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toStrictEqual(86400000);

        expect(DateHelpers.compare(
            new Date('2020-12-30T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
            'day',
            true
        )).toStrictEqual(86400000);

        expect(DateHelpers.compare(
            new Date('2020-12-28T13:26:15.893Z'),
            new Date('2020-12-29T13:26:15.893Z'),
        )).toStrictEqual(-86400000);

    });

    test('unix', () => {

        expect(DateHelpers.unix(new Date('2020-12-30T13:26:15.893Z'))).toStrictEqual(1609334775);

        expect(DateHelpers.unix(new Date('2020-12-12T13:26:15.893Z'))).toStrictEqual(1607779575);
    });

    test('unixDayIndex', () => {

        expect(DateHelpers.unixDayIndex(new Date('2020-12-30T13:26:15.893Z'))).toStrictEqual(18626);

        expect(DateHelpers.unixDayIndex(new Date('2022-12-30T13:26:15.893Z'))).toStrictEqual(19356);
    });

    test('dateFromUnixDayIndex', () => {

        expect(DateHelpers.dateFromUnixDayIndex(18626)).toStrictEqual(new Date('2020-12-30T00:00:00.000Z'));

        expect(DateHelpers.dateFromUnixDayIndex(19356)).toStrictEqual(new Date('2022-12-30T00:00:00.000Z'));

        expect(DateHelpers.dateFromUnixDayIndex(0)).toStrictEqual(new Date('1970-01-01T00:00:00.000Z'));
    });

    test('Format.toDatePicker', () => {
        expect(DateHelpers.Format.toDatePicker(new Date('2022-12-30T13:26:15.893Z'))).toStrictEqual('2022-12-30');

        expect(DateHelpers.Format.toDatePicker(new Date('2019-08-19T00:00:00.000Z'))).toStrictEqual('2019-08-19');
        expect(DateHelpers.Format.toDatePicker(undefined)).toBeNull();
    });

    test('convert', () => {

        expect(() => DateHelpers.convert(1000, undefined, 'second')).toThrow('Unsupported granularity');
    
        expect(DateHelpers.convert(1000, 'millisecond', 'second')).toStrictEqual(1);
        expect(DateHelpers.convert(1000, 'millisecond', 'minute')).toStrictEqual(1/60);

        expect(DateHelpers.convert(1000, 'second', 'millisecond')).toStrictEqual(Math.pow(1000, 2));
        expect(DateHelpers.convert(300, 'second', 'minute')).toStrictEqual(5);
        expect(DateHelpers.convert(60*60, 'second', 'hour')).toStrictEqual(1);
        expect(DateHelpers.convert(60*60*2, 'second', 'day')).toStrictEqual(1/12);
        expect(DateHelpers.convert(60*60*24*1.5, 'second', 'week')).toStrictEqual(1.5/7);

        expect(DateHelpers.convert(123, 'minute', 'second')).toStrictEqual(7380);
        expect(DateHelpers.convert(3213, 'minute', 'hour')).toStrictEqual(53.55);
        expect(DateHelpers.convert(60*61, 'minute', 'hour')).toStrictEqual(61);
        expect(DateHelpers.convert(60*36, 'minute', 'day')).toStrictEqual(1.5);
        expect(DateHelpers.convert(60*24*14, 'minute', 'week')).toStrictEqual(2);

        expect(DateHelpers.convert(2.5, 'hour', 'second')).toStrictEqual(9000);
        expect(DateHelpers.convert(11.5, 'hour', 'minute')).toStrictEqual(690);
        expect(DateHelpers.convert(234, 'hour', 'day')).toStrictEqual(9.75);
        expect(DateHelpers.convert(24*35, 'hour', 'week')).toStrictEqual(5);

        expect(DateHelpers.convert(1/2, 'day', 'second')).toStrictEqual(43200);
        expect(DateHelpers.convert(1/60, 'day', 'minute')).toStrictEqual(24);
        expect(DateHelpers.convert(11, 'day', 'minute')).toStrictEqual(15840);
        expect(DateHelpers.convert(4, 'day', 'hour')).toStrictEqual(96);
        expect(DateHelpers.convert(28, 'day', 'week')).toStrictEqual(4);
        expect(DateHelpers.convert(3.5, 'day', 'week')).toStrictEqual(0.5);
    })

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
            {amount: 1, granularity: 'year'},
            null
        )).toThrow();

        const aYearFromNow = new Date();
        aYearFromNow.setFullYear(aYearFromNow.getFullYear() + 1);
        aYearFromNow.setMilliseconds(0);
        const forwardResult = DateHelpers.Period.forward({amount: 1, granularity: 'year'});
        forwardResult.setMilliseconds(0);
        expect(forwardResult).toStrictEqual(aYearFromNow);

        expect(DateHelpers.Period.forward(
            {amount: 1, granularity: 'year'},
            now
        )).toStrictEqual(DateHelpers.add(now, 1, 'year'));

        expect(DateHelpers.Period.forward(
            {amount: 5, granularity: 'month'},
            now
        )).toStrictEqual(DateHelpers.add(now, 5, 'month'));

        expect(DateHelpers.Period.forward(
            {amount: 12, granularity: 'week'},
            now
        )).toStrictEqual(DateHelpers.add(now, 12, 'week'));

        expect(DateHelpers.Period.forward(
            {amount: 99, granularity: 'day'},
            now
        )).toStrictEqual(DateHelpers.add(now, 99, 'day'));

        expect(DateHelpers.Period.forward(
            {amount: 24, granularity: 'hour'},
            now
        )).toStrictEqual(DateHelpers.add(now, 24, 'hour'));

        expect(DateHelpers.Period.forward(
            {amount: 60, granularity: 'minute'},
            now
        )).toStrictEqual(DateHelpers.add(now, 60, 'minute'));

        expect(DateHelpers.Period.forward(
            {amount: 630, granularity: 'second'},
            now
        )).toStrictEqual(DateHelpers.add(now, 630, 'second'));

        expect(DateHelpers.Period.forward(
            {amount: 2, granularity: 'millisecond'},
            now
        )).toStrictEqual(DateHelpers.add(now, 2, 'millisecond'));
    });

    test('Period.backward', () => {
        const now = new Date('2020-12-22T16:16:18.774Z');

        const aYearAgo = new Date();
        aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);
        aYearAgo.setMilliseconds(0);
        const backwardResult = DateHelpers.Period.backward({amount: 1, granularity: 'year'});
        backwardResult.setMilliseconds(0);
        expect(backwardResult).toStrictEqual(aYearAgo);

        expect(DateHelpers.Period.backward(
            {amount: 1, granularity: 'year'},
            now
        )).toStrictEqual(DateHelpers.add(now, -1, 'year'));

        expect(DateHelpers.Period.backward(
            {amount: 5, granularity: 'month'},
            now
        )).toStrictEqual(DateHelpers.add(now, -5, 'month'));

        expect(DateHelpers.Period.backward(
            {amount: 12, granularity: 'week'},
            now
        )).toStrictEqual(DateHelpers.add(now, -12, 'week'));

        expect(DateHelpers.Period.backward(
            {amount: 99, granularity: 'day'},
            now
        )).toStrictEqual(DateHelpers.add(now, -99, 'day'));

        expect(DateHelpers.Period.backward(
            {amount: 24, granularity: 'hour'},
            now
        )).toStrictEqual(DateHelpers.add(now, -24, 'hour'));

        expect(DateHelpers.Period.backward(
            {amount: 60, granularity: 'minute'},
            now
        )).toStrictEqual(DateHelpers.add(now, -60, 'minute'));

        expect(DateHelpers.Period.backward(
            {amount: 630, granularity: 'second'},
            now
        )).toStrictEqual(DateHelpers.add(now, -630, 'second'));

        expect(DateHelpers.Period.backward(
            {amount: 2, granularity: 'millisecond'},
            now
        )).toStrictEqual(DateHelpers.add(now, -2, 'millisecond'));

    });

    test('Period.toMs', () => {

        expect(DateHelpers.Period.toMs({amount: 1, granularity: 'year'})).toStrictEqual(31622400000);

        expect(DateHelpers.Period.toMs({amount: 4.5, granularity: 'month'})).toStrictEqual(10540800000);

        expect(DateHelpers.Period.toMs({amount: 3, granularity: 'week'})).toStrictEqual(1814400000);

        expect(DateHelpers.Period.toMs({amount: 70, granularity: 'day'})).toStrictEqual(6048000000);

        expect(DateHelpers.Period.toMs({amount: 12, granularity: 'hour'})).toStrictEqual(43200000);

        expect(DateHelpers.Period.toMs({amount: 58, granularity: 'minute'})).toStrictEqual(3480000);

        expect(DateHelpers.Period.toMs({amount: 84, granularity: 'second'})).toStrictEqual(84000);

        expect(DateHelpers.Period.toMs({amount: 999, granularity: 'millisecond'})).toStrictEqual(999);
    })
    
    test('Period.format', () => {

        expect(DateHelpers.Period.format({amount: 2, granularity: 'year'})).toStrictEqual('2 years');
        expect(DateHelpers.Period.format({amount: 1, granularity: 'year'})).toStrictEqual('1 year');

        expect(DateHelpers.Period.format({amount: 3, granularity: 'month'})).toStrictEqual('3 months');
        expect(DateHelpers.Period.format({amount: 1, granularity: 'month'})).toStrictEqual('1 month');

        expect(DateHelpers.Period.format({amount: 343, granularity: 'week'})).toStrictEqual('343 weeks');
        expect(DateHelpers.Period.format({amount: 1, granularity: 'week'})).toStrictEqual('1 week');

        expect(DateHelpers.Period.format({amount: 101, granularity: 'day'})).toStrictEqual('101 days');
        expect(DateHelpers.Period.format({amount: 1, granularity: 'day'})).toStrictEqual('1 day');

        expect(DateHelpers.Period.format({amount: 3244, granularity: 'hour'})).toStrictEqual('3244 hours');
        expect(DateHelpers.Period.format({amount: 1, granularity: 'hour'})).toStrictEqual('1 hour');

        expect(DateHelpers.Period.format({amount: 878, granularity: 'minute'})).toStrictEqual('878 minutes');
        expect(DateHelpers.Period.format({amount: 1, granularity: 'minute'})).toStrictEqual('1 minute');

        expect(DateHelpers.Period.format({amount: 7, granularity: 'second'})).toStrictEqual('7 seconds');
        expect(DateHelpers.Period.format({amount: 1, granularity: 'second'})).toStrictEqual('1 second');

        expect(DateHelpers.Period.format({amount: 78, granularity: 'millisecond'})).toStrictEqual('78 milliseconds');
        expect(DateHelpers.Period.format({amount: 1, granularity: 'millisecond'})).toStrictEqual('1 millisecond');
    });

    test('YearDate.isValid', () => {
    
        expect(DateHelpers.YearDate.isValid({day: 12, month: 12})).toBeTruthy();
        expect(DateHelpers.YearDate.isValid({day: 1, month: 31})).toBeTruthy();
        expect(DateHelpers.YearDate.isValid({day: 132, month: 31})).toBeTruthy();
        expect(DateHelpers.YearDate.isValid({day: 14234, month: 31333})).toBeTruthy();
    });

    test('YearDate.toDate', () => {
        const currentYear = new Date().getFullYear()
        expect(DateHelpers.YearDate.toDate({day: 30, month: 12}, 2020)).toStrictEqual(new Date('2021-01-30T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate({day: 1, month: 31}, 2021)).toStrictEqual(new Date('2023-08-01T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate({day: 14, month: 7}, 2020)).toStrictEqual(new Date('2020-08-14T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate({day: 6, month: 3}, 2022)).toStrictEqual(new Date('2022-04-06T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate(undefined, 2022)).toStrictEqual(null);
        expect(DateHelpers.YearDate.toDate({day: null, month: null}, 2019)).toStrictEqual(new Date('2019-01-01T12:00:00.000Z'));
        expect(DateHelpers.YearDate.toDate({day: null, month: null}, undefined)).toStrictEqual(new Date(`${currentYear}-01-01T12:00:00.000Z`));
    });

    test('YearDate.equals', () => {
        expect(DateHelpers.YearDate.equals({day: null, month: null}, {day: null, month: null})).toBeTruthy();
        expect(DateHelpers.YearDate.equals(undefined, {day: 12, month: 12})).toBeFalsy();
        expect(DateHelpers.YearDate.equals(undefined, undefined)).toBeTruthy();
        expect(DateHelpers.YearDate.equals({day: 12, month: 12}, {day: 12, month: 12})).toBeTruthy();
        expect(DateHelpers.YearDate.equals({day: 1, month: 31}, {day: 30, month: 12})).toBeFalsy();
        expect(DateHelpers.YearDate.equals({day: 4, month: 4}, {day: 4, month: 4})).toBeTruthy();
        expect(DateHelpers.YearDate.equals({day: 434, month: 434}, {day: 434, month: 434})).toBeTruthy();
    });

    test('YearDate.fromDate', () => {

        expect(DateHelpers.YearDate.fromDate(new Date('2021-01-30T12:00:00.000Z'))).toStrictEqual({day: 30, month: 0});
        expect(DateHelpers.YearDate.fromDate(new Date('2022-12-09T00:00:00.000Z'))).toStrictEqual({day: 9, month: 11});
        expect(DateHelpers.YearDate.fromDate(new Date('2021-01-01T12:00:00.000Z'))).toStrictEqual({day: 1, month: 0});
        expect(DateHelpers.YearDate.fromDate(new Date('2021-12-31T12:00:00.000Z'))).toStrictEqual({day: 31, month: 11});
        expect(DateHelpers.YearDate.fromDate(new Date('2021-14-31T12:00:00.000Z'))).toStrictEqual({day: NaN, month: NaN});
    });

    test('YearDate.matches', () => {
        
        expect(DateHelpers.YearDate.matches({month: 11, day: 12}, new Date('2020-12-12T12:00:00.000Z'), false)).toBeTruthy();
        expect(DateHelpers.YearDate.matches({month: 11, day: 12}, new Date('2020-12-12T12:00:00.000Z'), true)).toBeTruthy();
        expect(DateHelpers.YearDate.matches({month: 10, day: 22}, new Date('2020-11-22T12:00:00.000Z'), true)).toBeTruthy();
        expect(DateHelpers.YearDate.matches({month: 12, day: 12}, new Date('2020-12-12T12:00:00.000Z'), false)).toBeFalsy();
        expect(DateHelpers.YearDate.matches({month: 10, day: 22}, new Date('2020-10-22T12:00:00.000Z'), true)).toBeFalsy();
        expect(DateHelpers.YearDate.matches(undefined, new Date('2020-10-22T12:00:00.000Z'), true)).toBeFalsy();
        expect(DateHelpers.YearDate.matches(undefined, new Date('2020-10-22T12:00:00.000Z'), false)).toBeFalsy();
        expect(DateHelpers.YearDate.matches({month: null, day: null}, new Date('2020-12-12T12:00:00.000Z'), true)).toBeFalsy();
        expect(DateHelpers.YearDate.matches({month: null, day: null}, new Date('2020-12-12T12:00:00.000Z'))).toBeFalsy();
        expect(DateHelpers.YearDate.matches({month: undefined, day: undefined}, new Date('2020-12-12T12:00:00.000Z'), true)).toBeFalsy();
        expect(DateHelpers.YearDate.matches({month: undefined, day: undefined}, new Date('2020-12-12T12:00:00.000Z'))).toBeFalsy();
        expect(() => DateHelpers.YearDate.matches({month: null, day: null}, undefined)).toThrow();
        expect(() => DateHelpers.YearDate.matches({month: null, day: null}, undefined, true)).toThrow();
        expect(() => DateHelpers.YearDate.matches(undefined, undefined)).toThrow();
    });

    test('getTime', () => {

        expect(DateHelpers.getTime(new Date('2020-11-29T13:26:15.893Z'))).toStrictEqual(1606656375893);
        expect(DateHelpers.getTime(new Date('2020-09-19T00:00:00.893Z'))).toStrictEqual(1600473600893);
        expect(DateHelpers.getTime(new Date('2020-06-09T23:59:59.893Z'))).toStrictEqual(1591747199893);
    });

    test('getDate', () => {

        expect(DateHelpers.getDate(new Date('2020-11-29T13:26:15.893Z'))).toStrictEqual(new Date('2020-11-29T13:26:15.893Z'));
        expect(DateHelpers.getDate(1600473600893)).toStrictEqual(new Date('2020-09-19T00:00:00.893Z'));
        expect(DateHelpers.getDate(undefined)).toStrictEqual(null);
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

    test('Format.yearDate', () => {

        expect(DateHelpers.Format.yearDate({month: 9, day: 1})).toStrictEqual('October 1');
        expect(DateHelpers.Format.yearDate({month: 9, day: 1}, true)).toStrictEqual('Oct 1');

        expect(DateHelpers.Format.yearDate({month: 7, day: 31})).toStrictEqual('August 31');
        expect(DateHelpers.Format.yearDate({month: 7, day: 31}, true)).toStrictEqual('Aug 31');

        expect(DateHelpers.Format.yearDate({month: 3, day: 24})).toStrictEqual('April 24');
        expect(DateHelpers.Format.yearDate({month: 3, day: 24}, true)).toStrictEqual('Apr 24');

        expect(DateHelpers.Format.yearDate({month: 9, day: null})).toStrictEqual('October 1');
        expect(DateHelpers.Format.yearDate({month: 9, day: null}, true)).toStrictEqual('Oct 1');

        expect(DateHelpers.Format.yearDate({month: null, day: 1})).toStrictEqual('January 1');
        expect(DateHelpers.Format.yearDate({month: null, day: 1}, true)).toStrictEqual('Jan 1');

        expect(DateHelpers.Format.yearDate({month: null, day: null})).toStrictEqual('January 1');
        expect(DateHelpers.Format.yearDate({month: null, day: null}, true)).toStrictEqual('Jan 1');

        expect(DateHelpers.Format.yearDate(undefined)).toStrictEqual('January 1');
        expect(DateHelpers.Format.yearDate(undefined, true)).toStrictEqual('Jan 1');
    });

    test('Format.toLocalDate', () => {

        expect(DateHelpers.Format.toLocalDate(new Date('2020-07-29T13:26:15.893Z'))).toStrictEqual('7/29/2020');
        expect(DateHelpers.Format.toLocalDate(1608729767257)).toStrictEqual('12/23/2020');
        expect(DateHelpers.Format.toLocalDate(undefined)).toStrictEqual(null);
    });

    test('Parse.fromDatePicker', () => {

        expect(DateHelpers.Parse.fromDatePicker('2020-07-29T13:26:15.893Z')).toStrictEqual(new Date('2020-07-29T13:26:15.893Z'));
        expect(DateHelpers.Parse.fromDatePicker('2020-07-29T13:26:15.893Z', true)).toStrictEqual(new Date('2020-07-29T13:26:15.893Z'));
    });

    test('Parse.toDistance', () => {

        expect(() => DateHelpers.Format.toDistance(undefined, new Date('2020-07-29T10:27:15.893Z'))).toThrow();
        expect( DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), undefined)).toMatch(/weeks ago/);

        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-07-29T10:27:15.893Z'))).toStrictEqual('Today');

        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-06-29T10:26:15.893Z'))).toStrictEqual('In 4 weeks');
        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-07-28T10:26:15.893Z'))).toStrictEqual('Tomorrow');
        expect(DateHelpers.Format.toDistance(new Date('2020-08-01T10:26:15.893Z'), new Date('2020-07-28T10:26:15.893Z'))).toStrictEqual('In 4 days');
        expect(DateHelpers.Format.toDistance(new Date('2020-08-04T10:26:15.893Z'), new Date('2020-07-28T10:26:15.893Z'))).toStrictEqual('In a week');

        expect(DateHelpers.Format.toDistance(new Date('2020-06-29T10:26:15.893Z'), new Date('2020-07-29T10:26:15.893Z'))).toStrictEqual('4 weeks ago');
        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-07-30T10:26:15.893Z'))).toStrictEqual('Yesterday');
        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-08-01T10:26:15.893Z'))).toStrictEqual('3 days ago');
        expect(DateHelpers.Format.toDistance(new Date('2020-07-29T10:26:15.893Z'), new Date('2020-08-05T10:26:15.893Z'))).toStrictEqual('Week ago');
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

        expect(DateHelpers.Format.timespan(10012030)).toStrictEqual('2h 46m 52s');
        expect(DateHelpers.Format.timespan(100129)).toStrictEqual('1m 40s');
        expect(DateHelpers.Format.timespan(10129)).toStrictEqual('10s');

        expect(DateHelpers.Format.timespan(10912939, true)).toStrictEqual('3h 1m 53s');
        expect(DateHelpers.Format.timespan(100129, true)).toStrictEqual('1m 40s');
        expect(DateHelpers.Format.timespan(10129, true)).toStrictEqual('10s');
    });

    test('decompose', () => {

        expect(DateHelpers.decompose(
            new Date('2020-05-29T10:26:15.893Z'),
            true, 
            ...['day', 'hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {day: 18411, hour: 10, minute: 26, second: 16} );

        expect(DateHelpers.decompose(
            new Date('2020-05-29T10:26:15.893Z'),
            false, 
            ...['day', 'hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {day: 18411, hour: 10, minute: 26, second: 16} );

        expect(DateHelpers.decompose(
            new Date('2020-08-01T10:26:15.893Z'),
            false, 
            ...['hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {hour: 443410, minute: 26, second: 16} );

        expect(DateHelpers.decompose(
            new Date('2020-01-01T00:00:00.000Z'),
            false, 
            ...['day', 'hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {day: 18262, hour: 0, minute: 0, second: 0} );

        expect(DateHelpers.decompose(
            new Date('2020-12-31T23:59:59.999Z'),
            false, 
            ...['day', 'hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {day: 18628, hour: 0, minute: 0, second: 0} );

        expect(DateHelpers.decompose(
            new Date('2020-12-31T23:59:59.000Z'),
            false, 
            ...['day', 'hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {day: 18627, hour: 23, minute: 59, second: 59} );
    });

    test('decomposeMs', () => {

        expect(DateHelpers.decomposeMs(
            new Date('2020-12-31T23:59:59.000Z').getTime(),
            ...['hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {hour: 447071, minute: 59, second: 59} );

        expect(DateHelpers.decomposeMs(
            new Date('2020-12-31T00:00:00.000Z').getTime(),
            ...['day', 'hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {day: 18627, hour: 0, minute: 0, second: 0} );

        expect(DateHelpers.decomposeMs(
            new Date('2020-12-31T23:32:12.000Z').getTime(),
            ...['second'] as Granularity[]
        )).toStrictEqual( {second: 1609457532} );

        expect(DateHelpers.decomposeMs(
            new Date('2020-12-31T23:32:12.000Z').getTime(),
            'hour' as Granularity
        )).toStrictEqual( {hour: 447071} );
    });

    test('decomposeDate', () => {

        expect(DateHelpers.decomposeDate(
            new Date('2020-01-01T00:00:00.000Z'),
            false,
            ...['month', 'day', 'hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {month: 1, day: 1, hour: 0, minute: 0, second: 0} );

        expect(DateHelpers.decomposeDate(
            new Date('2020-12-31T23:59:59.000Z'),
            false,
            ...['week', 'day', 'hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {day: 31, hour: 23, minute: 59, second: 59} );

        expect(DateHelpers.decomposeDate(
            new Date('2020-08-04T10:26:15.893Z'),
            false,
            ...['hour', 'minute', 'second'] as Granularity[]
        )).toStrictEqual( {hour: 10, minute: 26, second: 15} );
    });

    test('Format.Presets.use', () => {

        expect(DateHelpers.Format.Presets.use(
            DateHelpers.Format.Presets.FullDay_ShortDate,
            new Date('2020-08-04T10:26:15.893Z')
        )).toStrictEqual('Tuesday 04.08.2020');

        expect(DateHelpers.Format.Presets.use(
            DateHelpers.Format.Presets.ShortDate_FullTime,
            new Date('2019-09-11T10:26:15.893Z')
        )).toStrictEqual('11.09.2019 10.26.15');

        expect(DateHelpers.Format.Presets.use(
            DateHelpers.Format.Presets.FullDay_ShortDate,
            new Date('2020-12-20T01:31:59.893Z'),
            false
        )).toStrictEqual('Sunday 20.12.2020');

        expect(DateHelpers.Format.Presets.use(
            DateHelpers.Format.Presets.ShortDate_FullTime,
            new Date('2020-08-12T10:26:15.893Z'),
            false
        )).toStrictEqual('12.08.2020 10.26.15');

        expect(DateHelpers.Format.Presets.use(
            undefined,
            new Date('2020-08-12T10:26:15.893Z')
        )).toStrictEqual(undefined);
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

        expect(DateHelpers.splitDatesByDay(undefined)).toStrictEqual([]);
    });

    test('getDaysStreak', () => {

        const getDayWithOffset = (offset: number) => new Date().setDate(new Date().getDate() + offset);

        expect(DateHelpers.getDaysStreak(
            [getDayWithOffset(0), getDayWithOffset(1), getDayWithOffset(2), getDayWithOffset(3), getDayWithOffset(4), getDayWithOffset(5)], 
            false
        )).toStrictEqual(6);

        expect(DateHelpers.getDaysStreak(
            [getDayWithOffset(0), getDayWithOffset(-1), getDayWithOffset(-2), getDayWithOffset(-3), getDayWithOffset(-4), getDayWithOffset(-5)], 
            true
        )).toStrictEqual(6);

        expect(DateHelpers.getDaysStreak(
            [getDayWithOffset(1), getDayWithOffset(2), getDayWithOffset(5), getDayWithOffset(6), getDayWithOffset(7)], 
            false
        )).toStrictEqual(2);

        expect(DateHelpers.getDaysStreak(
            [getDayWithOffset(3), getDayWithOffset(4), getDayWithOffset(5), getDayWithOffset(6), getDayWithOffset(7)], 
            false
        )).toStrictEqual(0);

        expect(DateHelpers.getDaysStreak(
            [], 
            false
        )).toStrictEqual(0);
    });

    test('DateX.get', () => {
        const baseDate = () => new Date('2020-08-12T10:26:15.893Z');
        expect(DateHelpers.DateX.get(baseDate(), 'millisecond', false)).toStrictEqual(893);
        expect(DateHelpers.DateX.get(baseDate(), 'second', false)).toStrictEqual(15);
        expect(DateHelpers.DateX.get(baseDate(), 'minute', false)).toStrictEqual(26);
        expect(DateHelpers.DateX.get(baseDate(), 'hour', false)).toStrictEqual(10);
        expect(DateHelpers.DateX.get(baseDate(), 'day', false)).toStrictEqual(12);
        expect(DateHelpers.DateX.get(baseDate(), 'month', false)).toStrictEqual(7);
        expect(DateHelpers.DateX.get(baseDate(), 'year', false)).toStrictEqual(2020);

        expect(() => DateHelpers.DateX.get(baseDate(), 'week', false)).toThrow('Not supported');

        expect(DateHelpers.DateX.get(baseDate(), 'millisecond', true)).toStrictEqual(893);
        expect(DateHelpers.DateX.get(baseDate(), 'second', true)).toStrictEqual(15);
        expect(DateHelpers.DateX.get(baseDate(), 'minute', true)).toStrictEqual(26);
        expect(DateHelpers.DateX.get(baseDate(), 'hour', true)).toStrictEqual(10);
        expect(DateHelpers.DateX.get(baseDate(), 'day', true)).toStrictEqual(12);
        expect(DateHelpers.DateX.get(baseDate(), 'month', true)).toStrictEqual(7);
        expect(DateHelpers.DateX.get(baseDate(), 'year', true)).toStrictEqual(2020);

        expect(() => DateHelpers.DateX.get(baseDate(), 'week', true)).toThrow('Not supported');

        expect(() => DateHelpers.DateX.get(undefined, 'day', false)).toThrow();
        expect(DateHelpers.DateX.get(baseDate(), undefined, false)).toStrictEqual(1597227975893);
        expect(DateHelpers.DateX.get(baseDate(), 'day', undefined)).toStrictEqual(12);
    });

    test('DateX.set', () => {
        const baseDate = () => new Date('2020-08-12T10:26:15.893Z');
        expect(DateHelpers.DateX.set(baseDate(), 'year', true, 2018)).toStrictEqual(1534069575893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018)).toStrictEqual(1534069575893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018, 11)).toStrictEqual(1544610375893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018, 11, 1)).toStrictEqual(1543659975893); 

        expect(() => DateHelpers.DateX.set(undefined, 'year', false, 2018)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined, false, 2018)).toStrictEqual(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', undefined, 2018)).toStrictEqual(1534069575893);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, undefined)).toStrictEqual(NaN);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018, undefined)).toStrictEqual(NaN);
        expect(DateHelpers.DateX.set(baseDate(), 'year', false, 2018, 11, undefined)).toStrictEqual(NaN);

        expect(DateHelpers.DateX.set(baseDate(), 'month', false, 3)).toStrictEqual(1586687175893);
        expect(DateHelpers.DateX.set(baseDate(), 'month', false, 3, 0)).toStrictEqual(1585650375893);

        expect(() => DateHelpers.DateX.set(undefined, 'month', false, 3)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined, false, 3)).toStrictEqual(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'month', undefined, 3)).toStrictEqual(1586687175893);
        expect(DateHelpers.DateX.set(baseDate(), 'month', false, undefined)).toStrictEqual(NaN);

        expect(() => DateHelpers.DateX.set(baseDate(), 'week' as 'year', false, 2018)).toThrow('Not supported');

        expect(DateHelpers.DateX.set(baseDate(), 'day', false, 1)).toStrictEqual(1596277575893);

        expect(() => DateHelpers.DateX.set(undefined, 'day', false, 1)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined, false, 1)).toStrictEqual(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'day', undefined, 1)).toStrictEqual(1596277575893);
        expect(DateHelpers.DateX.set(baseDate(), 'day', false, undefined)).toStrictEqual(NaN);

        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12)).toStrictEqual(1597235175893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30)).toStrictEqual(1597235415893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30, 30)).toStrictEqual(1597235430893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30, 30, 555)).toStrictEqual(1597235430555);

        expect(() => DateHelpers.DateX.set(undefined, 'hour', false, 12)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined, false, 12)).toStrictEqual(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', undefined, 12)).toStrictEqual(1597235175893);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, undefined)).toStrictEqual(NaN);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, undefined)).toStrictEqual(NaN);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30, undefined)).toStrictEqual(NaN);
        expect(DateHelpers.DateX.set(baseDate(), 'hour', false, 12, 30, 30, undefined)).toStrictEqual(NaN);

        expect(DateHelpers.DateX.set(baseDate(), 'minute', true, 30)).toStrictEqual(1597228215893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30)).toStrictEqual(1597228215893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30, 30)).toStrictEqual(1597228230893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30, 30, 555)).toStrictEqual(1597228230555);

        expect(() => DateHelpers.DateX.set(undefined, 'minute', false, 30)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined, false, 30)).toStrictEqual(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', undefined, 30)).toStrictEqual(1597228215893);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, undefined)).toStrictEqual(NaN);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30, undefined)).toStrictEqual(NaN);
        expect(DateHelpers.DateX.set(baseDate(), 'minute', false, 30, 30, undefined)).toStrictEqual(NaN);

        expect(DateHelpers.DateX.set(baseDate(), 'second', true, 30)).toStrictEqual(1597227990893);
        expect(DateHelpers.DateX.set(baseDate(), 'second', false, 30)).toStrictEqual(1597227990893);
        expect(DateHelpers.DateX.set(baseDate(), 'second', false, 30, 555)).toStrictEqual(1597227990555);

        expect(() => DateHelpers.DateX.set(undefined, 'second', false, 30)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined, false, 30)).toStrictEqual(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'second', undefined, 30)).toStrictEqual(1597227990893);
        expect(DateHelpers.DateX.set(baseDate(), 'second', false, undefined)).toStrictEqual(NaN);
        expect(DateHelpers.DateX.set(baseDate(), 'second', false, 30, undefined)).toStrictEqual(NaN);

        expect(DateHelpers.DateX.set(baseDate(), 'millisecond', false, 300)).toStrictEqual(1597227975300);
        expect(DateHelpers.DateX.set(baseDate(), 'millisecond', true, 300)).toStrictEqual(1597227975300);

        expect(() => DateHelpers.DateX.set(undefined, 'millisecond', false, 30)).toThrow();
        expect(DateHelpers.DateX.set(baseDate(), undefined, false, 300)).toStrictEqual(1597227975893);
        expect(DateHelpers.DateX.set(baseDate(), 'millisecond', undefined, 300)).toStrictEqual(1597227975300);
        expect(DateHelpers.DateX.set(baseDate(), 'millisecond', false, undefined)).toStrictEqual(NaN);
    });

    test('ensureDates', () => {

        type TestEnsureDates = {
            date: Date;
            start: Date;
            end:  Date;
        };

        const testEnsureDatesNullValues: TestEnsureDates = {
            date: null,
            start: null, 
            end: null,
        };
        
        const testEnsureDatesValidDates: TestEnsureDates = {
            date: new Date('2020-08-12T10:26:15.000Z'),
            start: new Date('2020-05-09T11:02:55.000Z'), 
            end: new Date('2020-11-23T12:34:56.000Z'),
        };

        const testEnsureDatesStringDates: TestEnsureDates = {
            date: '2020-08-12T10:26:15.000Z' as null,
            start: '2020-05-09T11:02:55.000Z' as null, 
            end: '2020-11-23T12:34:56.000Z' as null,
        };

        const testEnsureDatesUnixDates: TestEnsureDates = {
            date: 1597227975000 as null,
            start: 1589022175000 as null, 
            end: 1606134896000 as null,
        };

        const baseExpectedResult = { 
            date: new Date('2020-08-12T10:26:15.000Z'), 
            end: new Date('2020-11-23T12:34:56.000Z'), 
            start: new Date('2020-05-09T11:02:55.000Z')
        };

        DateHelpers.ensureDates(testEnsureDatesNullValues, 'start', 'end', 'date')
        expect(testEnsureDatesNullValues).toStrictEqual({date: null, end: null, start: null});

        DateHelpers.ensureDates(testEnsureDatesValidDates, 'start', 'end', 'date')
        expect(testEnsureDatesValidDates).toStrictEqual(baseExpectedResult);

        DateHelpers.ensureDates(testEnsureDatesStringDates, 'start', 'end', 'date');
        expect(testEnsureDatesStringDates).toStrictEqual(baseExpectedResult);

        DateHelpers.ensureDates(testEnsureDatesUnixDates, 'start', 'end', 'date');
        expect(testEnsureDatesUnixDates).toStrictEqual(baseExpectedResult);

        const empty = undefined;
        DateHelpers.ensureDates(undefined, 'start', 'end', 'date')
        expect(empty).toBeUndefined();
    });
});
