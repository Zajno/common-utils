import { CalendarIndex, basedFloor, basedRemainder } from '../calendarIndex';

type Parts = { month: number, week: number, fullWeek: number, day: number };

const testIndex = (raw: number, factory: () => CalendarIndex, { month, week, fullWeek, day }: Parts) => {
    const read = factory();
    read.raw = raw;
    expect(read.day).toBe(day);
    expect(read.month).toBe(month);
    expect(read.fullWeek).toBe(fullWeek);
    expect(read.week).toBe(week);
    expect(read.toIndex()).toEqual({ month, week, day });

    const write = factory();
    write.set(month, week, day);
    expect(write.raw).toBe(raw);
    expect(write.day).toBe(day);
    expect(write.month).toBe(month);
    expect(write.fullWeek).toBe(fullWeek);
    expect(write.week).toBe(week);
};

const testCombo = (raw: number, perWeek: number, month: number, week: number, fullWeek: number, day: number) => {
    return testIndex(raw, () => new CalendarIndex(perWeek), { month, week, fullWeek, day });
};

describe('CalendarIndex', () => {

    test('basedRemainder 0-based', () => {
        expect(basedRemainder(0, 0, 5)).toBe(0);
        expect(basedRemainder(0, 1, 5)).toBe(1);
        expect(basedRemainder(0, 3, 5)).toBe(3);
        expect(basedRemainder(0, 5, 5)).toBe(0);
        expect(basedRemainder(0, 6, 5)).toBe(1);
    });

    test('basedRemainder 1-based', () => {
        expect(basedRemainder(1, 0, 5)).toBe(0);
        expect(basedRemainder(1, 1, 5)).toBe(1);
        expect(basedRemainder(1, 2, 5)).toBe(2);
        expect(basedRemainder(1, 5, 5)).toBe(5);
        expect(basedRemainder(1, 6, 5)).toBe(1);
        expect(basedRemainder(1, 7, 5)).toBe(2);
        expect(basedRemainder(1, 10, 5)).toBe(5);

        expect(basedRemainder(1, 49, 7)).toBe(7);

        expect(basedRemainder(1, 100, 10)).toBe(10);
        expect(basedRemainder(1, 101, 10)).toBe(1);
    });

    test('basedFloor 0-based', () => {
        expect(basedFloor(0, 0, 5)).toBe(0);
        expect(basedFloor(0, 1, 5)).toBe(0);
        expect(basedFloor(0, 2, 5)).toBe(0);
        expect(basedFloor(0, 4, 5)).toBe(0);

        expect(basedFloor(0, 5, 5)).toBe(1);
        expect(basedFloor(0, 6, 5)).toBe(1);
        expect(basedFloor(0, 9, 5)).toBe(1);

        expect(basedFloor(0, 10, 5)).toBe(2);
        expect(basedFloor(0, 14, 5)).toBe(2);

        expect(basedFloor(0, 15, 5)).toBe(3);
    });

    test('basedFloor 1-based', () => {
        expect(basedFloor(1, 0, 5)).toBe(0);

        expect(basedFloor(1, 1, 5)).toBe(1);
        expect(basedFloor(1, 2, 5)).toBe(1);
        expect(basedFloor(1, 4, 5)).toBe(1);
        expect(basedFloor(1, 5, 5)).toBe(1);

        expect(basedFloor(1, 6, 5)).toBe(2);
        expect(basedFloor(1, 9, 5)).toBe(2);
        expect(basedFloor(1, 10, 5)).toBe(2);

        expect(basedFloor(1, 14, 5)).toBe(3);
        expect(basedFloor(1, 15, 5)).toBe(3);
    });

    test('0-based', () => {
        testCombo(123, 5, 6, 0, 24, 3);
        testCombo(3, 5, 0, 0, 0, 3);
        testCombo(9, 5, 0, 1, 1, 4);
        testCombo(0, 5, 0, 0, 0, 0);

        testCombo(123, 1, 30, 3, 123, 0);
        testCombo(12, 1, 3, 0, 12, 0);
    });

    test('1-based', () => {
        const f = () => new CalendarIndex(5, 1);
        const testShifted = (raw: number, parts: Parts) => testIndex(raw, f, parts);

        testShifted(0, { month: 0, week: 0, fullWeek: 0, day: 0 });
        testShifted(1, { month: 1, week: 1, fullWeek: 1, day: 1 });
        testShifted(3, { month: 1, week: 1, fullWeek: 1, day: 3 });
        testShifted(5, { month: 1, week: 1, fullWeek: 1, day: 5 });
        testShifted(6, { month: 1, week: 2, fullWeek: 2, day: 1 });

        testShifted(20, { month: 1, week: 4, fullWeek: 4, day: 5 });
        testShifted(21, { month: 2, week: 1, fullWeek: 5, day: 1 });
        testShifted(25, { month: 2, week: 1, fullWeek: 5, day: 5 });
        testShifted(40, { month: 2, week: 4, fullWeek: 8, day: 5 });

        testShifted(41, { month: 3, week: 1, fullWeek: 9, day: 1 });
    });
});
