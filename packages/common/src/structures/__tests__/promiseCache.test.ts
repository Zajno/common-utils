
import { setTimeoutAsync } from '../../async/timeout';
import { ILogger } from '../../logger';
import { random } from '../../math';
import { DeferredGetter, PromiseCache } from '../promiseCache';

describe('PromiseCache', () => {

    it('Empty Deferred Getter', async () => {
        expect(DeferredGetter.Empty.current).toBeNull();
        expect(DeferredGetter.Empty.busy).toBe(false);

        await expect(DeferredGetter.Empty.promise).resolves.toBeNull();
    });

    it('hard load', async () => {

        const COUNT = 1000;
        const TEST_ID = '123';
        const TEST_OBJ = { HELLO: 'WORLD' };

        const loaderFn = vi.fn();

        const cache = new PromiseCache(async _id => {
            loaderFn();
            await setTimeoutAsync(200);
            return TEST_OBJ;
        }, null, null);

        expect(cache.busyCount).toBe(0);

        let busyCount = 0;
        for (let i = 0; i < COUNT; ++i) {
            const curr = cache.getDeferred(TEST_ID);
            if (!curr.current && curr.busy) {
                ++busyCount;
            }
        }

        expect(loaderFn).toHaveBeenCalledTimes(1);
        expect(busyCount).toBe(COUNT);

        await expect(cache.getDeferred(TEST_ID).promise).resolves.toBe(TEST_OBJ);
    });

    it('infrastructure', async () => {
        const loaderFn = vi.fn();
        const TEST_OBJ = { HELLO: 'WORLD' };

        const getRes = (id: string | number) => ({ ...TEST_OBJ, id });

        const fetcher = async (id: string | number) => {
            loaderFn();
            await setTimeoutAsync(200);
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

        await expect(cache.get(123)).resolves.toStrictEqual({ ...TEST_OBJ, id: 123 });
        expect(loaderFn).toHaveBeenCalledTimes(1);

        expect(cache.keys()).toStrictEqual(['123']);
        cache.invalidate(123);
        expect(cache.keys()).toStrictEqual([]);

        loaderFn.mockClear();

        const batchLoaderFn = vi.fn();
        const batchLoader = async (ids: number[]) => {
            batchLoaderFn();
            await setTimeoutAsync(100);
            return ids.map(getRes);
        };

        cache.useBatching(batchLoader);

        const filler = new Array<number>(5).fill(0, 0, 5);

        const results = Promise.all(
            filler.map(async (_, i) => {
                setTimeoutAsync(10 * i);
                return cache.get(i);
            }),
        );

        expect(loaderFn).not.toHaveBeenCalled();

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

        cache.invalidate(1);

        expect(cache.hasKey(1)).toBe(false);

        cache.updateValueDirectly(1, getRes(1));
        expect(cache.hasKey(1)).toBe(true);

        const def = cache.getDeferred(1);
        expect(def.current).not.toBeUndefined();
        expect(def.busy).toBeFalsy();
        await expect(def.promise).resolves.toStrictEqual(getRes(1));
    });

    it('fetching fails', async () => {
        const cache = new PromiseCache<number, number>(
            async _id => {
                await setTimeoutAsync(100);
                throw new Error('Fetch failed');
            },
            id => id.toString(),
            id => +id,
        )
        .useLogger('')
        .useBatching(async _ids => {
            await setTimeoutAsync(100);
            throw new Error('Batch fetch failed');
        });

        await expect(Promise.all([cache.get(1), cache.get(2)])).resolves.toStrictEqual([null, null]);

        cache.useBatching(null!);

        await expect(cache.get(3)).resolves.toBeNull();
    });

    it('batching fails', async () => {

        const loaderFn = vi.fn();
        const TEST_OBJ = { HELLO: 'WORLD' };

        const getRes = (id: string | number) => ({ ...TEST_OBJ, id });

        const fetcher = async (id: string | number) => {
            loaderFn();
            await setTimeoutAsync(200);
            return getRes(id);
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
            await setTimeoutAsync(100);
            throw batchError;
        };

        cache.useBatching(batchLoader);

        const logger: ILogger = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        };
        cache.useLogger(logger);

        const filler = new Array<number>(5).fill(0, 0, 5);

        const results = Promise.all(
            filler.map(async (_, i) => {
                setTimeoutAsync(10 * i);
                return cache.get(i);
            }),
        );

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

    it('clears', async () => {
        const cache = new PromiseCache<number, number>(
            async id => {
                await setTimeoutAsync(200);
                return id;
            },
            id => id.toString(),
            id => +id,
        ).useLogger('test');

        expect(cache.hasKey(1)).toBe(false);

        const p1 = cache.get(1);

        await setTimeoutAsync(50);

        expect(cache.hasKey(1)).toBe(true);

        cache.clear();

        expect(cache.hasKey(1)).toBe(false);

        await expect(p1).resolves.toBe(1);

        expect(cache.getCurrent(1, false)).toBeUndefined();
    });

    it('auto-invalidation', async () => {
        const generator = vi.fn(() => random(0, 1000));

        const cache = new PromiseCache<string, string>(
            async id => {
                await setTimeoutAsync(200);
                return `${id}_${generator()}`;
            },
        ).useInvalidationTime(100);

        await expect(cache.get('1')).resolves.toBeTruthy();
        expect(generator).toHaveBeenCalledTimes(1);
        generator.mockClear();

        await expect(cache.get('1')).resolves.toBeTruthy();
        expect(generator).toHaveBeenCalledTimes(0);
        generator.mockClear();

        await setTimeoutAsync(101);

        await expect(cache.get('1')).resolves.toBeTruthy();
        expect(generator).toHaveBeenCalledTimes(1);
        generator.mockClear();
    });
});
