import { setTimeoutAsync } from '../../async/timeout.js';
import { catchPromise } from '../safe.js';
import { DebounceAction, DebounceProcessor } from '../debounce.js';

describe('debounce', () => {

    it('should debounce and return last result', async () => {
        const debounce = new DebounceAction(100);
        let counter = 1;
        const cb = vi.fn(() => ++counter);

        debounce.tryRun(cb);
        debounce.tryRun(cb);
        await setTimeoutAsync(10);
        debounce.tryRun(cb);
        await setTimeoutAsync(10);
        debounce.tryRun(cb);

        expect(cb).not.toHaveBeenCalled();

        const p = debounce.getPromise();

        await setTimeoutAsync(100);

        await expect(p).resolves.toBe(counter);

        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('should debounce and return last result - with arguments', async () => {
        const debounce = new DebounceAction<number>(100);
        let counter = 1;
        const cb = vi.fn((v: number) => setTimeoutAsync(50).then(() => v));
        const wrapCb = () => cb(++counter);

        debounce.tryRun(wrapCb);
        debounce.tryRun(wrapCb);

        await setTimeoutAsync(10);
        debounce.tryRun(wrapCb);

        await setTimeoutAsync(10);
        debounce.tryRun(wrapCb, true);

        expect(cb).not.toHaveBeenCalled();

        const p = debounce.getPromise();

        await setTimeoutAsync(10);

        catchPromise(debounce.forceRun());

        await setTimeoutAsync(150);

        await expect(p).resolves.toBe(counter);

        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('DebounceProcessor debounces and returns a result value', async () => {
        let result: number | null = null;
        const cb = vi.fn(async (values: number[]): Promise<number> => {
            await setTimeoutAsync(50);
            result = values.reduce((a, b) => a + b, 0);
            return result;
        });
        const processor = new DebounceProcessor<number, number>(cb, 100);

        const initial = 1;
        let final = initial;
        const repeats = 5;
        const promises: Promise<{ result: number | undefined, index: number }>[] = [];

        for (let i = 0; i < repeats; i++) {
            promises.push(processor.push(final++));
        }

        expect(cb).not.toHaveBeenCalled();

        await setTimeoutAsync(100 + 50 + 10);

        const expectedSum = repeats * (initial + final - 1) / 2;
        expect(result).toBe(expectedSum);

        for (let i = 0; i < repeats; ++i) {
            const promise = promises[i];
            await expect(promise).resolves.toStrictEqual({ result: expectedSum, index: i });
        }

        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('DebounceProcessor handles subsequent debounces', async () => {

        type Result = { id: number };

        const resultProcessor = vi.fn((_values: Result[]) => { /* no-op */ });

        const loadMany = vi.fn(async (values: number[]) => {
            await setTimeoutAsync(50);
            const res = values.map(v => ({ id: v }));
            resultProcessor(res);
            return res;
        });
        const processor = new DebounceProcessor(loadMany, 100);

        const doRequests = async (delay = 0, start = 1) => {
            const initial = start;
            const repeats = 5;

            let final = initial;
            const res: Result[] = [];
            const promises: Promise<{ result: Result[] | undefined, index: number }>[] = [];

            for (let i = 0; i < repeats; i++) {
                if (delay) {
                    await setTimeoutAsync(delay);
                }

                const id = final++;
                promises.push(processor.push(id));
                res.push({ id });
            }

            return { res, promises };
        };

        const { res: expectedResult1, promises: promises1 } = await doRequests();

        expect(loadMany).not.toHaveBeenCalled();
        expect(resultProcessor).not.toHaveBeenCalled();

        await setTimeoutAsync(100 + 10); // processing started

        // pushing 2nd time
        const { res: expectedResult2, promises: promises2 } = await doRequests(10, 10);

        await setTimeoutAsync(50); // first batch processed

        expect(loadMany).toHaveBeenCalledTimes(1);
        expect(resultProcessor).toHaveBeenCalledTimes(1);
        expect(resultProcessor).toHaveBeenCalledWith(expectedResult1);

        await expect(Promise.all(promises1)).resolves.toStrictEqual(expectedResult1.map((_, i) => ({ result: expectedResult1, index: i })));

        loadMany.mockClear();
        resultProcessor.mockClear();

        await setTimeoutAsync(150); // wait for 2nd batch

        expect(loadMany).toHaveBeenCalledTimes(1);
        expect(resultProcessor).toHaveBeenCalledTimes(1);
        expect(resultProcessor).toHaveBeenCalledWith(expectedResult2);

        await expect(Promise.all(promises2)).resolves.toStrictEqual(expectedResult2.map((_, i) => ({ result: expectedResult2, index: i })));

        loadMany.mockClear();
        resultProcessor.mockClear();
    });

});
