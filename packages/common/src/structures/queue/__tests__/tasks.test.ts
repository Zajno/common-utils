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

    describe('pending getter', () => {
        it('returns 0 when queue is empty', () => {
            const queue = new TasksQueue(1);
            expect(queue.pending).toBe(0);
        });

        it('returns number of waiting tasks', async () => {
            const queue = new TasksQueue(1);

            const res1 = queue.enqueue(createFactory(1));
            expect(queue.pending).toBe(0); // running, not pending

            queue.enqueue(createFactory(2));
            expect(queue.pending).toBe(1);

            queue.enqueue(createFactory(3));
            expect(queue.pending).toBe(2);

            await res1;
            // After first completes, second starts running, third is pending
            expect(queue.pending).toBe(1);
        });
    });

    describe('delayBetweenTasks option', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('inserts delay between tasks', async () => {
            const queue = new TasksQueue<number>(1, { delayBetweenTasks: 200 });

            const order: number[] = [];

            const makeFactory = (val: number) => async () => {
                order.push(val);
                return val;
            };

            const p1 = queue.enqueue(makeFactory(1), 'task-1');
            const p2 = queue.enqueue(makeFactory(2), 'task-2');
            const p3 = queue.enqueue(makeFactory(3), 'task-3');

            // Task 1 runs immediately (microtask)
            await vi.advanceTimersByTimeAsync(0);
            expect(order).toEqual([1]);

            // After task 1 completes, delay of 200ms before task 2 starts
            await vi.advanceTimersByTimeAsync(100);
            expect(order).toEqual([1]); // still waiting for delay

            await vi.advanceTimersByTimeAsync(100);
            // Delay elapsed, task 2 should run
            await vi.advanceTimersByTimeAsync(0);
            expect(order).toEqual([1, 2]);

            // Another 200ms delay before task 3
            await vi.advanceTimersByTimeAsync(200);
            await vi.advanceTimersByTimeAsync(0);
            expect(order).toEqual([1, 2, 3]);

            await expect(p1).resolves.toBe(1);
            await expect(p2).resolves.toBe(2);
            await expect(p3).resolves.toBe(3);
        });

        it('does not delay when queue is empty after task', async () => {
            const queue = new TasksQueue<number>(1, { delayBetweenTasks: 500 });

            const start = Date.now();
            const p1 = queue.enqueue(async () => 42, 'single-task');

            await vi.advanceTimersByTimeAsync(0);
            await expect(p1).resolves.toBe(42);

            // Should complete almost immediately — no 500ms delay since queue was empty
            const elapsed = Date.now() - start;
            expect(elapsed).toBeLessThan(100);
        });

        it('applies delay even after task failure', async () => {
            const errorHandler = vi.fn();
            const queue = new TasksQueue<number>(1, {
                delayBetweenTasks: 200,
                onTaskError: errorHandler,
            });

            const order: string[] = [];

            queue.enqueue(async () => {
                order.push('fail');
                throw new Error('boom');
            }, 'failing-task');

            const p2 = queue.enqueue(async () => {
                order.push('success');
                return 42;
            }, 'success-task');

            // Run the failing task
            await vi.advanceTimersByTimeAsync(0);
            expect(order).toEqual(['fail']);
            expect(errorHandler).toHaveBeenCalledWith(expect.any(Error), 'failing-task');

            // Delay should still apply
            await vi.advanceTimersByTimeAsync(100);
            expect(order).toEqual(['fail']); // still waiting

            await vi.advanceTimersByTimeAsync(100);
            await vi.advanceTimersByTimeAsync(0);
            expect(order).toEqual(['fail', 'success']);

            await expect(p2).resolves.toBe(42);
        });
    });

    describe('onTaskError callback', () => {
        it('catches errors and resolves with undefined when onTaskError is set', async () => {
            const errorHandler = vi.fn();
            const queue = new TasksQueue<string>(1, { onTaskError: errorHandler });

            const error = new Error('task failed');
            const result = await queue.enqueue(async () => {
                throw error;
            }, 'my-task');

            expect(result).toBeUndefined();
            expect(errorHandler).toHaveBeenCalledTimes(1);
            expect(errorHandler).toHaveBeenCalledWith(error, 'my-task');
        });

        it('uses factory.name when task name is not provided', async () => {
            const errorHandler = vi.fn();
            const queue = new TasksQueue<string>(1, { onTaskError: errorHandler });

            const error = new Error('oops');
            async function myNamedFactory(): Promise<string> {
                throw error;
            }

            await queue.enqueue(myNamedFactory);

            expect(errorHandler).toHaveBeenCalledWith(error, 'myNamedFactory');
        });

        it('continues processing after error', async () => {
            const errorHandler = vi.fn();
            const queue = new TasksQueue<number>(1, { onTaskError: errorHandler });

            const p1 = queue.enqueue(async () => {
                throw new Error('first fails');
            }, 'task-1');

            const p2 = queue.enqueue(async () => 42, 'task-2');

            await expect(p1).resolves.toBeUndefined();
            await expect(p2).resolves.toBe(42);
            expect(errorHandler).toHaveBeenCalledTimes(1);
        });

        it('rethrows when onTaskError is not set (default behavior)', async () => {
            const queue = new TasksQueue<number>(1);

            const error = new Error('should propagate');
            await expect(
                queue.enqueue(async () => { throw error; }, 'failing'),
            ).rejects.toThrow('should propagate');
        });

        it('handles queued task errors with onTaskError', async () => {
            const errorHandler = vi.fn();
            const queue = new TasksQueue<number>(1, { onTaskError: errorHandler });

            // First task succeeds
            const p1 = queue.enqueue(async () => {
                await setTimeoutAsync(10);
                return 1;
            }, 'task-1');

            // Second task (queued) fails
            const p2 = queue.enqueue(async () => {
                throw new Error('queued task fails');
            }, 'task-2');

            // Third task (queued) succeeds
            const p3 = queue.enqueue(async () => 3, 'task-3');

            await expect(p1).resolves.toBe(1);
            await expect(p2).resolves.toBeUndefined();
            await expect(p3).resolves.toBe(3);

            expect(errorHandler).toHaveBeenCalledTimes(1);
            expect(errorHandler).toHaveBeenCalledWith(expect.any(Error), 'task-2');
        });
    });

    describe('enqueueDelayed', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('enqueues task after specified delay', async () => {
            const queue = new TasksQueue<number>(1);
            const factory = vi.fn(async () => 42);

            const { promise } = queue.enqueueDelayed(factory, 1000, 'delayed-task');

            expect(factory).not.toHaveBeenCalled();
            expect(queue.running).toBe(0);
            expect(queue.pending).toBe(0);

            await vi.advanceTimersByTimeAsync(500);
            expect(factory).not.toHaveBeenCalled();

            await vi.advanceTimersByTimeAsync(500);
            // Timer fired, task should be enqueued and running
            await vi.advanceTimersByTimeAsync(0);
            expect(factory).toHaveBeenCalledTimes(1);
            await expect(promise).resolves.toBe(42);
        });

        it('returns a promise that resolves with the task result', async () => {
            const queue = new TasksQueue<number>(1);

            const { promise } = queue.enqueueDelayed(async () => 99, 500, 'delayed-result');

            await vi.advanceTimersByTimeAsync(500);
            await vi.advanceTimersByTimeAsync(0);

            await expect(promise).resolves.toBe(99);
        });

        it('returns a promise that rejects when the task throws', async () => {
            const errorHandler = vi.fn();
            const queue = new TasksQueue<number>(1, { onTaskError: errorHandler });

            const { promise } = queue.enqueueDelayed(async () => {
                throw new Error('delayed boom');
            }, 500, 'delayed-fail');

            await vi.advanceTimersByTimeAsync(500);
            await vi.advanceTimersByTimeAsync(0);

            // With onTaskError, the error is handled internally and promise resolves with undefined
            await expect(promise).resolves.toBeUndefined();
            expect(errorHandler).toHaveBeenCalledWith(expect.any(Error), 'delayed-fail');
        });

        it('returns a promise that rejects when the task throws without onTaskError', async () => {
            const queue = new TasksQueue<number>(1);

            const { promise } = queue.enqueueDelayed(async () => {
                throw new Error('delayed boom no handler');
            }, 500, 'delayed-fail-no-handler');

            // Attach rejection handler before timer fires to prevent unhandled rejection
            const rejection = expect(promise).rejects.toThrow('delayed boom no handler');

            await vi.advanceTimersByTimeAsync(500);
            await vi.advanceTimersByTimeAsync(0);

            await rejection;
        });

        it('cancel prevents enqueue and rejects the promise', async () => {
            const queue = new TasksQueue<number>(1);
            const factory = vi.fn(async () => 42);

            const { promise, cancel } = queue.enqueueDelayed(factory, 1000, 'delayed-task');

            // Attach rejection handler before cancel() to prevent unhandled rejection
            const rejection = expect(promise).rejects.toThrow('Cancelled');

            await vi.advanceTimersByTimeAsync(500);
            cancel();

            await vi.advanceTimersByTimeAsync(1000);
            expect(factory).not.toHaveBeenCalled();
            await rejection;
        });

        it('cancel is a no-op after task has started', async () => {
            const queue = new TasksQueue<number>(1);

            const { promise, cancel } = queue.enqueueDelayed(async () => 42, 100, 'delayed-task');

            await vi.advanceTimersByTimeAsync(100);
            await vi.advanceTimersByTimeAsync(0);

            // Task already started, cancel should be a no-op
            cancel();

            await expect(promise).resolves.toBe(42);
        });

        it('respects queue limit and ordering', async () => {
            const queue = new TasksQueue<number>(1);
            const order: number[] = [];

            // Start a long-running task
            queue.enqueue(async () => {
                await setTimeoutAsync(500);
                order.push(1);
                return 1;
            }, 'task-1');

            // Schedule a delayed task
            const { promise: delayedPromise } = queue.enqueueDelayed(async () => {
                order.push(2);
                return 2;
            }, 200, 'delayed-task');

            // After 200ms, delayed task fires but queue is full
            await vi.advanceTimersByTimeAsync(200);
            expect(order).toEqual([]);
            expect(queue.pending).toBe(1); // delayed task is now queued

            // After 500ms total, first task completes, delayed task runs
            await vi.advanceTimersByTimeAsync(300);
            await vi.advanceTimersByTimeAsync(0);
            expect(order).toEqual([1, 2]);
            await expect(delayedPromise).resolves.toBe(2);
        });

        it('does not cause unhandled rejection when delayed task throws without onTaskError', async () => {
            const queue = new TasksQueue<number>(1);

            const unhandledRejections: unknown[] = [];
            const processHandler = (err: unknown) => {
                unhandledRejections.push(err);
            };
            process.on('unhandledRejection', processHandler);

            const { promise } = queue.enqueueDelayed(async () => {
                throw new Error('delayed task boom');
            }, 100, 'failing-delayed');

            // Attach handler before timer fires to prevent unhandled rejection
            const rejection = expect(promise).rejects.toThrow('delayed task boom');

            await vi.advanceTimersByTimeAsync(100);
            await vi.advanceTimersByTimeAsync(0);

            // Give microtasks a chance to propagate
            await vi.advanceTimersByTimeAsync(0);

            await rejection;

            process.off('unhandledRejection', processHandler);

            expect(unhandledRejections).toHaveLength(0);
        });
    });

    describe('clear', () => {
        it('removes all pending tasks and rejects their promises', async () => {
            const queue = new TasksQueue<number>(1);

            const p1 = queue.enqueue(createFactory(1));
            const p2 = queue.enqueue(createFactory(2));
            const p3 = queue.enqueue(createFactory(3));

            expect(queue.pending).toBe(2);

            // Attach rejection handlers before clear() so Node doesn't flag them as unhandled
            // while we await p1 (which takes ~50ms to complete)
            const p2Rejection = expect(p2).rejects.toThrow('TasksQueue cleared');
            const p3Rejection = expect(p3).rejects.toThrow('TasksQueue cleared');

            queue.clear();

            expect(queue.pending).toBe(0);
            // Running task should still complete
            expect(queue.running).toBe(1);
            await expect(p1).resolves.toBe(1);
            // Cleared pending promises should have rejected
            await p2Rejection;
            await p3Rejection;
        });

        it('cancels delayed enqueues and rejects their promises', async () => {
            vi.useFakeTimers();

            const queue = new TasksQueue<number>(1);
            const factory = vi.fn(async () => 42);

            const d1 = queue.enqueueDelayed(factory, 1000, 'delayed-1');
            const d2 = queue.enqueueDelayed(factory, 2000, 'delayed-2');

            // Attach rejection handlers before clear()
            const d1Rejection = expect(d1.promise).rejects.toThrow('Cancelled');
            const d2Rejection = expect(d2.promise).rejects.toThrow('Cancelled');

            queue.clear();

            await vi.advanceTimersByTimeAsync(3000);
            expect(factory).not.toHaveBeenCalled();

            await d1Rejection;
            await d2Rejection;

            vi.useRealTimers();
        });

        it('does not cancel running tasks', async () => {
            const queue = new TasksQueue<number>(1);
            const cb = vi.fn();

            const p1 = queue.enqueue(createFactory(42, cb));
            expect(queue.running).toBe(1);

            queue.clear();

            // Running task should still complete
            await expect(p1).resolves.toBe(42);
            expect(cb).toHaveBeenCalled();
            expect(queue.running).toBe(0);
        });
    });

    describe('constructor options', () => {
        it('accepts options as second parameter', () => {
            const queue = new TasksQueue<void>(1, {
                delayBetweenTasks: 1000,
                onTaskError: () => { /* noop */ },
            });
            expect(queue).toBeDefined();
            expect(queue.limit).toBe(1);
        });

        it('works without options (backward compatible)', () => {
            const queue = new TasksQueue<void>(1);
            expect(queue).toBeDefined();
        });
    });
});
