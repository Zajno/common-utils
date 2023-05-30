import { setTimeoutAsync } from '../../async/timeout';
import { ThrottleAction, ThrottleProcessor } from '../throttle';

describe('throttle', () => {

    it('should throttle and return last result', async () => {
        const throttle = new ThrottleAction(100);
        let counter = 1;
        const cb = jest.fn(() => ++counter);

        throttle.tryRun(cb);
        throttle.tryRun(cb);
        await setTimeoutAsync(10);
        throttle.tryRun(cb);
        await setTimeoutAsync(10);
        throttle.tryRun(cb);

        expect(cb).not.toHaveBeenCalled();

        const p = throttle.getPromise();

        await setTimeoutAsync(100);

        await expect(p).resolves.toBe(counter);

        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('should throttle and return last result - with arguments', async () => {
        const throttle = new ThrottleAction<number>(100);
        let counter = 1;
        const cb = jest.fn((v: number) => setTimeoutAsync(50).then(() => v));
        const wrapCb = () => cb(++counter);

        throttle.tryRun(wrapCb);
        throttle.tryRun(wrapCb);

        await setTimeoutAsync(10);
        throttle.tryRun(wrapCb);

        await setTimeoutAsync(10);
        throttle.tryRun(wrapCb, true);

        expect(cb).not.toHaveBeenCalled();

        const p = throttle.getPromise();

        await setTimeoutAsync(10);

        throttle.forceRun();

        await setTimeoutAsync(150);

        await expect(p).resolves.toBe(counter);

        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('ThrottleProcessor throttles and returns a result value', async () => {
        let result: number = null;
        const cb = jest.fn((values: number[]) => setTimeoutAsync(50).then(() => {
            result = values.reduce((a, b) => a + b, 0);
            return result;
        }));
        const processor = new ThrottleProcessor<number>(cb, 100);

        const initial = 1;
        let final = initial;
        const repeats = 5;
        let promise: Promise<number> = null;

        for (let i = 0; i < repeats; i++) {
            promise = processor.push(final++);
        }

        expect(cb).not.toHaveBeenCalled();

        await setTimeoutAsync(200);

        const expectedSum = repeats * (initial + final - 1) / 2;
        expect(result).toBe(expectedSum);

        await expect(promise).resolves.toBe(expectedSum);

        expect(cb).toHaveBeenCalledTimes(1);
    });

});
