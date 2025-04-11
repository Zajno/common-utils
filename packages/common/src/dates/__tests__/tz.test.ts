import { Timezones } from '../tz.js';

describe('timezones', () => {
    test('getOffset', async () => {

        // winter time, no DST
        const noDSTDate = new Date('2025-01-01T00:00:00Z');
        // summer time, DST expected except for Asia/Kolkata
        const DSTDate = new Date('2025-07-01T00:00:00Z');

        expect(Timezones.getOffset('UTC', noDSTDate)).toBe(0);
        expect(Timezones.getOffset('UTC', DSTDate)).toBe(0);

        expect(Timezones.getOffset('America/Los_Angeles', noDSTDate)).toBe(8 * 60);
        expect(Timezones.getOffset('America/Los_Angeles', DSTDate)).toBe(7 * 60);

        expect(Timezones.getOffset('America/New_York', noDSTDate)).toBe(5 * 60);
        expect(Timezones.getOffset('America/New_York', DSTDate)).toBe(4 * 60);

        expect(Timezones.getOffset('Europe/Lisbon', noDSTDate)).toBe(0 * 60);
        expect(Timezones.getOffset('Europe/Lisbon', DSTDate)).toBe(-1 * 60);

        expect(Timezones.getOffset('Europe/Paris', noDSTDate)).toBe(-1 * 60);
        expect(Timezones.getOffset('Europe/Paris', DSTDate)).toBe(-2 * 60);

        expect(Timezones.getOffset('Europe/Kyiv', noDSTDate)).toBe(-2 * 60);
        expect(Timezones.getOffset('Europe/Kyiv', DSTDate)).toBe(-3 * 60);

        expect(Timezones.getOffset('Asia/Kolkata', noDSTDate)).toBe(-5.5 * 60);
        expect(Timezones.getOffset('Asia/Kolkata', DSTDate)).toBe(-5.5 * 60);

        await expect((async () => Timezones.getOffset('invalid', noDSTDate))()).rejects.toThrow(
            'Invalid time zone specified: invalid',
        );
    });

    test('shiftToTimeZone', () => {
        const date = new Date('2025-01-01T12:00:00.000Z');
        const shifted = Timezones.shiftToTimeZone(date, 'America/New_York');
        expect(shifted.toISOString()).toBe('2025-01-01T17:00:00.000Z');
    });
});
