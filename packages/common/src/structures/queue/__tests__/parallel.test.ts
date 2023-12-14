import 'jest-extended';
import { ParallelQueue } from '../parallel';
import { setTimeoutAsync, timeoutPromise } from '../../../async/timeout';
import { setMode } from '../../../logger';
import { oneTimeSubscription } from '../../../observing/event';

const createLoader = (amount = 100) => vi.fn(() => setTimeoutAsync(amount));

setMode('console');

describe('ParallelQueue', () => {
    it('runs', async () => {

        const q = new ParallelQueue()
            // .withLogger('test 1')
        ;

        expect(q.inProgress).toBeFalsy();

        const f1 = createLoader();
        const f2 = createLoader();
        q.enqueue(f1);
        q.enqueue(f2);

        expect(f1).not.toHaveBeenCalled();
        expect(f2).not.toHaveBeenCalled();

        const res = q.start();
        expect(q.inProgress).toBeTruthy();

        expect(q.currentPriority).toBe(0);

        const f3 = createLoader();
        const f4 = createLoader();

        q.enqueue(f3);

        q.enqueue(f4, 1);

        await expect(q.start()).resolves.toBeUndefined();

        await expect(res).resolves.toBe(true);

        expect(q.inProgress).toBeFalsy();
        expect(q.currentPriority).toBe(1);

        expect(f1).toHaveBeenCalledBefore(f2);
        expect(f2).toHaveBeenCalledAfter(f1);
        expect(f3).toHaveBeenCalledAfter(f2);
        expect(f4).toHaveBeenCalledAfter(f3);

        const f5 = createLoader();

        q.enqueue(f5);

        await setTimeoutAsync(100);

        expect(f5).toHaveBeenCalledAfter(f4);
    });

    it('correctly fires events with scattered priorities', async () => {
        const q = new ParallelQueue()
            .withLogger('test 2')
        ;

        const dummyFn = createLoader(0);
        const workerFn = createLoader();
        const skippedFn1 = createLoader(0);
        const skippedFn2 = createLoader(0);

        const beforeCb = vi.fn(r => r);
        const afterCb = vi.fn(r => r);

        const BasePriority = 5;

        const cancel1 = q.enqueue(skippedFn1, 0);

        expect(cancel1()).toBe(true);
        // does not success on the second call
        expect(cancel1()).toBe(false);

        const finishPromise = q.start();

        const cancel2 = q.enqueue(skippedFn2, BasePriority + 1);

        q.enqueue(dummyFn, BasePriority);
        q.enqueue(workerFn, BasePriority + 1);

        oneTimeSubscription(q.beforePriorityRun, p => p != null && p >= BasePriority)
            .then(beforeCb);

        const waitPromise = timeoutPromise(
            oneTimeSubscription(q.afterPriorityRun, p => p != null && p >= BasePriority)
                .then(afterCb)
            ,
            200,
        );

        await expect(waitPromise).resolves.toBeDefined();
        const res = await waitPromise;

        // this is not called because it was cancelled before executed (right after the start)
        expect(skippedFn1).not.toHaveBeenCalled();
        // this is called because it was NOT cancelled
        expect(skippedFn2).toHaveBeenCalled();

        expect(cancel2()).toBe(false);

        expect(res.resolved).toBe(BasePriority);
        expect(res.timedOut).toBe(false);

        await expect(finishPromise).resolves.toBe(true);

        expect(skippedFn2).toHaveBeenCalled();

        await expect(q.start()).resolves.toBeUndefined();

        await expect(oneTimeSubscription(q.finished)).resolves.not.toThrow();

        expect(beforeCb).toHaveBeenCalled();
        expect(afterCb).toHaveBeenCalled();
        expect(beforeCb).toHaveBeenCalledBefore(afterCb);

    });
});
