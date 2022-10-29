import 'jest-extended';
import { ParallelQueue } from '../parallel';
import { setTimeoutAsync } from '../../../async/timeout';
import { setMode } from '../../../logger';

const createLoader = () => jest.fn(() => setTimeoutAsync(100));

setMode('console');

describe('ParallelQueue', () => {
    it('runs', async () => {

        const q = new ParallelQueue()
            .withLogger('test');

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
});
