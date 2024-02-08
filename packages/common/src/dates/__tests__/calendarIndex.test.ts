import { CalendarIndex } from '../calendarIndex';

const testCombo = (raw: number, perWeek: number, month: number, week: number, fullWeek: number, day: number) => {
    const read = new CalendarIndex(perWeek);
    read.raw = raw;
    expect(read.month).toBe(month);
    expect(read.week).toBe(week);
    expect(read.fullWeek).toBe(fullWeek);
    expect(read.day).toBe(day);
    expect(read.toIndex()).toEqual({ month, week, day });

    const write = new CalendarIndex(perWeek);
    write.set(month, week, day);
    expect(write.raw).toBe(raw);
    expect(write.month).toBe(month);
    expect(write.week).toBe(week);
    expect(write.fullWeek).toBe(fullWeek);
    expect(write.day).toBe(day);
};

describe('CalendarIndex', () => {
    test('basic', () => {
        testCombo(123, 5, 6, 0, 24, 3);
        testCombo(3, 5, 0, 0, 0, 3);
        testCombo(9, 5, 0, 1, 1, 4);
        testCombo(0, 5, 0, 0, 0, 0);

        testCombo(123, 1, 30, 3, 123, 0);
        testCombo(12, 1, 3, 0, 12, 0);
    });
});
