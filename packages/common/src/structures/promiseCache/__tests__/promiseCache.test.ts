
import { type ILogger, LoggersManager } from '../../../logger/index.js';
import { random } from '../../../math/index.js';
import { DeferredGetter, PromiseCache } from '../index.js';

/** Helper: creates a delayed async function using fake timers */
function delayedValue<T>(ms: number, value: T): Promise<T> {
    return new Promise<T>(resolve => setTimeout(() => resolve(value), ms));
}

/** Helper: creates a delayed async function that throws using fake timers */
function delayedError(ms: number, error: Error): Promise<never> {
    return new Promise<never>((_, reject) => setTimeout(() => reject(error), ms));
}

describe('PromiseCache', () => {

    const { createLogger } = new LoggersManager().expose();

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('Empty Deferred Getter', async () => {
        expect(DeferredGetter.Empty.current).toBeUndefined();
        expect(DeferredGetter.Empty.isLoading).toBe(false);
        expect(DeferredGetter.Empty.error).toBeNull();

        await expect(DeferredGetter.Empty.promise).resolves.toBeUndefined();
    });

    it('hard load', async () => {
        const COUNT = 1000;
        const TEST_ID = '123';
        const TEST_OBJ = { HELLO: 'WORLD' };

        const loaderFn = vi.fn();

        const cache = new PromiseCache(async _id => {
            loaderFn();
            await delayedValue(200, undefined);
            return TEST_OBJ;
        }, null, null);

        expect(cache.loadingCount).toBe(0);

        // Trigger the first fetch
        void cache.get(TEST_ID);
        expect(loaderFn).toHaveBeenCalledTimes(1);

        let loadingCount = 0;
        for (let i = 0; i < COUNT; ++i) {
            const lazy = cache.getLazy(TEST_ID);
            if (!lazy.currentValue && lazy.isLoading) {
                ++loadingCount;
            }
        }

        expect(loadingCount).toBe(COUNT);

        const promise = cache.getLazy(TEST_ID).promise;
        await vi.advanceTimersByTimeAsync(200);
        await expect(promise).resolves.toBe(TEST_OBJ);
    });

    it('infrastructure', async () => {
        const loaderFn = vi.fn();
        const TEST_OBJ = { HELLO: 'WORLD' };

        const getRes = (id: string | number) => ({ ...TEST_OBJ, id });

        const fetcher = async (id: string | number) => {
            loaderFn();
            await delayedValue(200, undefined);
            return getRes(id);
        };

        const cacheNoAdapters = new PromiseCache(fetcher);

        expect(() => cacheNoAdapters.getCurrent(null as any)).toThrow();
        expect(() => cacheNoAdapters.getCurrent(123)).toThrow();
        expect(cacheNoAdapters.keysParsed()).toBeNull();

        const cache = new PromiseCache(
            fetcher,
            id => id.toString(),
            id => +id,
        );

        const p1 = cache.get(123);
        await vi.advanceTimersByTimeAsync(200);
        await expect(p1).resolves.toStrictEqual({ ...TEST_OBJ, id: 123 });
        expect(loaderFn).toHaveBeenCalledTimes(1);

        expect(cache.keys()).toStrictEqual(['123']);
        expect(Array.from(cache.keys(true))).toStrictEqual(['123']);
        cache.invalidate(123);
        expect(cache.keys()).toStrictEqual([]);

        loaderFn.mockClear();

        const batchLoaderFn = vi.fn();
        const batchLoader = async (ids: number[]) => {
            batchLoaderFn();
            await delayedValue(100, undefined);
            return ids.map(getRes);
        };

        cache.useBatching(batchLoader);

        const filler = new Array<number>(5).fill(0, 0, 5);

        const results = Promise.all(
            filler.map(async (_, i) => {
                await delayedValue(10 * i, undefined);
                return cache.get(i);
            }),
        );

        expect(loaderFn).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(400);

        await expect(results).resolves.toStrictEqual(
            filler.map((_, i) => getRes(i)),
        );

        filler.forEach((_, i) => {
            expect(cache.hasKey(i)).toBe(true);
            expect(cache.getCurrent(i)).toStrictEqual(getRes(i));
        });

        expect(batchLoaderFn).toHaveBeenCalledTimes(1);

        expect(cache.getCurrent(1)).toStrictEqual(getRes(1));

        expect(cache.keys()).toStrictEqual(filler.map((_, i) => i.toString()));
        expect(cache.keysParsed()).toStrictEqual(filler.map((_, i) => i));
        expect(Array.from(cache.keysParsed(true)!)).toStrictEqual(filler.map((_, i) => i));

        cache.invalidate(1);

        expect(cache.hasKey(1)).toBe(false);

        cache.updateValueDirectly(1, getRes(1));
        expect(cache.hasKey(1)).toBe(true);

        const lazy = cache.getLazy(1);
        expect(lazy.currentValue).not.toBeUndefined();
        expect(lazy.isLoading).toBeNull(); // status cleared by updateValueDirectly
        await expect(lazy.promise).resolves.toStrictEqual(getRes(1));
    });

    it('fetching fails', async () => {
        const cache = new PromiseCache<number, number>(
            async _id => delayedError(100, new Error('Fetch failed')),
            id => id.toString(),
            id => +id,
        )
            .setLoggerFactory(createLogger, '')
            .useBatching(async _ids => delayedError(100, new Error('Batch fetch failed')));

        const p = Promise.all([cache.get(1), cache.get(2)]);
        await vi.advanceTimersByTimeAsync(500);
        await expect(p).resolves.toStrictEqual([undefined, undefined]);

        cache.useBatching(null!);

        const p2 = cache.get(3);
        await vi.advanceTimersByTimeAsync(100);
        await expect(p2).resolves.toBeUndefined();
    });

    it('batching fails', async () => {
        const loaderFn = vi.fn();
        const TEST_OBJ = { HELLO: 'WORLD' };

        const getRes = (id: string | number) => ({ ...TEST_OBJ, id });

        const fetcher = async (id: string | number) => {
            loaderFn();
            return delayedValue(200, getRes(id));
        };

        const cache = new PromiseCache(
            fetcher,
            id => id.toString(),
            id => +id,
        );

        const batchError = new Error('Batching failed in test');

        const batchLoaderFn = vi.fn();
        const batchLoader = async (_ids: number[]) => {
            batchLoaderFn();
            return delayedError(100, batchError);
        };

        cache.useBatching(batchLoader);

        const logger: ILogger = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        };
        cache.setLogger(logger);

        const filler = new Array<number>(5).fill(0, 0, 5);

        const results = Promise.all(
            filler.map(async (_, i) => {
                await delayedValue(10 * i, undefined);
                return cache.get(i);
            }),
        );

        await vi.advanceTimersByTimeAsync(600);

        await expect(results).resolves.toStrictEqual(
            filler.map((_, i) => getRes(i)),
        );

        expect(batchLoaderFn).toHaveBeenCalledTimes(1);
        expect(loaderFn).toHaveBeenCalledTimes(5);

        expect(logger.warn).toHaveBeenCalledTimes(5);
        for (let i = 0; i < 5; ++i) {
            expect(logger.warn).toHaveBeenCalledWith('batch fetch failed', i, batchError);
        }
    });

    it('continuos batching', async () => {
        const getRes = (id: string | number) => ({ id });

        const fetcher = vi.fn(async (id: string | number) => {
            return delayedValue(10, getRes(id));
        });

        const cache = new PromiseCache(
            fetcher,
            id => id.toString(),
            id => +id,
        );

        const batchLoader = vi.fn(async (ids: number[]) => {
            return delayedValue(50, ids.map(getRes));
        });

        cache.useBatching(batchLoader, 50);

        const doRequests = (base = 1, delay = 10) => {
            const ids = Array.from({ length: 10 }).map((_, i) => i + base);

            const results = Promise.all(
                ids.map(async id => {
                    await delayedValue(delay, undefined);
                    return cache.get(id);
                }),
            );

            return { ids, results };
        };

        const { ids: ids1, results: results1 } = doRequests(1);

        await vi.advanceTimersByTimeAsync(210);

        const { ids: ids2, results: results2 } = doRequests(6);

        await vi.advanceTimersByTimeAsync(210);

        await expect(results1).resolves.toStrictEqual(ids1.map(getRes));
        await expect(results2).resolves.toStrictEqual(ids2.map(getRes));

        expect(batchLoader).toHaveBeenCalledTimes(2);
        expect(fetcher).toHaveBeenCalledTimes(0);
    });

    it('clears', async () => {
        const cache = new PromiseCache<number, number>(
            async id => delayedValue(200, id),
            id => id.toString(),
            id => +id,
        ).setLoggerFactory(createLogger, 'test');

        expect(cache.hasKey(1)).toBe(false);

        const p1 = cache.get(1);

        await vi.advanceTimersByTimeAsync(50);

        expect(cache.hasKey(1)).toBe(true);

        cache.clear();

        expect(cache.hasKey(1)).toBe(false);

        await vi.advanceTimersByTimeAsync(200);
        await expect(p1).resolves.toBe(1);

        expect(cache.getCurrent(1, false)).toBeUndefined();
    });

    it('auto-invalidation', async () => {
        const generator = vi.fn(() => random(0, 10000));

        const cache = new PromiseCache<string, string>(
            async id => delayedValue(50, `${id}_${generator()}`),
        ).useInvalidationTime(100);

        const checkGenerator = (times: number) => {
            expect(generator).toHaveBeenCalledTimes(times);
            generator.mockClear();
        };

        const p1 = cache.get('1');
        await vi.advanceTimersByTimeAsync(50);
        await expect(p1).resolves.toBeTruthy();
        checkGenerator(1);

        const p2 = cache.get('1');
        await expect(p2).resolves.toBeTruthy();
        checkGenerator(0);

        await vi.advanceTimersByTimeAsync(50);

        expect(cache.getCurrent('1')).toBeTruthy();

        await vi.advanceTimersByTimeAsync(51);

        expect(cache.getCurrent('1', false)).toBeUndefined();

        const p3 = cache.get('1');
        await vi.advanceTimersByTimeAsync(50);
        await expect(p3).resolves.toBeTruthy();
        checkGenerator(1);

        cache.useInvalidationTime(100, true);

        const previous = cache.getCurrent('1');
        expect(previous).toBeTruthy();

        checkGenerator(0);

        await vi.advanceTimersByTimeAsync(105);

        expect(cache.getCurrent('1', false)).toBe(previous);
        expect(cache.getLazy('1').isLoading).toBeNull(); // invalidated = not started

        const nextPromise = cache.get('1');
        await vi.advanceTimersByTimeAsync(50);
        await expect(nextPromise).resolves.toBeTruthy();
        await expect(nextPromise).resolves.not.toBe(previous);

        checkGenerator(1);
    });
});
