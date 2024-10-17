import { TasksQueue } from '../tasks.js';
import { setTimeoutAsync } from '../../../async/timeout.js';
import 'jest-extended';

describe('TasksQueue', () => {

    const createFactory = <T>(res: T, cb?: () => void) => {
        return async () => {
            await setTimeoutAsync(50);
            cb?.();
            return res;
        };
    };

    it('correctly initializes', async () => {
        const fnZero = async () => {
            return new TasksQueue(0);
        };
        const fnNegative = async () => {
            return new TasksQueue(-12);
        };
        const fnPositive = async () => {
            return new TasksQueue(12);
        };

        await expect(fnZero()).rejects.toThrow();
        await expect(fnNegative()).rejects.toThrow();
        await expect(fnPositive()).resolves.not.toBeNull();

        const failEnqueue = async () => {
            const q = new TasksQueue<number>(123);
            q.enqueue(null as any);
        };

        await expect(failEnqueue()).rejects.toThrow();
    });

    it('runs without limit', async () => {
        const queue = new TasksQueue(5);

        expect(queue.isFull).toBeFalsy();
        expect(queue.running).toBe(0);

        const val1 = 123;

        const res1 = queue.enqueue(createFactory(val1));

        expect(queue.isFull).toBeFalsy();
        expect(queue.running).toBe(1);

        await expect(res1).resolves.toBe(val1);
    });

    it('runs with limit 1', async () => {
        const queue = new TasksQueue(1);

        const val1 = 123;
        const cb1 = vi.fn();
        const res1 = queue.enqueue(createFactory(val1, cb1));

        const val2 = 321;
        const cb2 = vi.fn();
        const res2 = queue.enqueue(createFactory(val2, cb2));

        const val3 = 111;
        const cb3 = vi.fn();
        const res3 = queue.enqueue(createFactory(val3, cb3));

        expect(queue.isFull).toBeTruthy();
        expect(queue.running).toBe(1);

        await expect(res1).resolves.toBe(val1);
        expect(queue.running).toBe(1);

        await expect(res2).resolves.toBe(val2);

        expect(queue.running).toBe(1);
        await expect(res3).resolves.toBe(val3);

        expect(queue.running).toBe(0);

        expect(cb1).toHaveBeenCalledBefore(cb2);
        expect(cb2).toHaveBeenCalledBefore(cb3);
        expect(cb3).toHaveBeenCalled();
    });
});
