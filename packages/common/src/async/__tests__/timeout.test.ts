
import { timeoutPromise, setTimeoutAsync } from '../timeout.js';
import { Event, oneTimeSubscription } from '../../observing/event.js';

describe('Timeouts', () => {

    describe('one-time subscription to event', () => {
        const createOneTimePromise = (finishOnStep = 3, totalSteps = 5) => {
            const e = new Event<number>();
            let currentValue = 0;

            const p = oneTimeSubscription(e, v => v === finishOnStep);

            const intervalRef = setInterval(() => {
                e.trigger(++currentValue);
                if (currentValue === totalSteps) {
                    clearInterval(intervalRef);
                }
            }, 100);

            return p;
        };

        it('just works as expected', async () => {

            const p = createOneTimePromise();

            await expect(p).resolves.toBe(3);
        });

        it('works with timing out', async () => {
            const p = createOneTimePromise();

            const timeoutResult = timeoutPromise(p, 200);

            await expect(timeoutResult).resolves.not.toBeNull();

            const res = await timeoutResult;

            expect(res.resolved).toBeUndefined();
            expect(res.timedOut).toBe(true);
            expect(res.elapsed).toBeLessThanOrEqual(210);
        });

        it('works without timing out', async () => {
            const p = createOneTimePromise();

            const timeoutResult = timeoutPromise(p, 400);

            await expect(timeoutResult).resolves.not.toBeNull();

            const res = await timeoutResult;

            expect(res.resolved).toBe(3);
            expect(res.timedOut).toBe(false);
            expect(res.elapsed).toBeLessThanOrEqual(410);
        });

        it('works without timing out with minimal run', async () => {
            const p = createOneTimePromise();

            const timeoutResult = timeoutPromise(p, 400, 350);

            await expect(timeoutResult).resolves.not.toBeNull();

            const res = await timeoutResult;

            expect(res.resolved).toBe(3);
            expect(res.timedOut).toBe(false);
            expect(res.elapsed).toBeGreaterThanOrEqual(349);
            expect(res.elapsed).toBeLessThanOrEqual(410);
        });
    });

    it('setTimeoutAsync', async () => {

        await expect(setTimeoutAsync(10)).resolves.not.toThrow();

        let onCancel: (() => void) | undefined = undefined;
        const p1 = setTimeoutAsync(10, cancel => {
            onCancel = cancel;
        });

        expect(onCancel).not.toBeUndefined();
        onCancel!();
        await expect(p1).rejects.toThrow();
        onCancel = undefined;

        const p2 = setTimeoutAsync(10, cancel => {
            onCancel = cancel;
        });
        await setTimeoutAsync(11);
        expect(onCancel).not.toBeUndefined();
        await expect(p2).resolves.not.toThrow();
        onCancel!();
        onCancel = undefined;
    });
});
