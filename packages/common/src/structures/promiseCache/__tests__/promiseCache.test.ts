
import { setTimeoutAsync } from '../../../async/timeout.js';
import { type ILogger, LoggersManager } from '../../../logger/index.js';
import { random } from '../../../math/index.js';
import { DeferredGetter, PromiseCache } from '../index.js';

describe('PromiseCache', () => {

    const { createLogger } = new LoggersManager().expose();

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
            await setTimeoutAsync(200);
            return TEST_OBJ;
        }, null, null);

        expect(cache.loadingCount).toBe(0);

        let loadingCount = 0;
        for (let i = 0; i < COUNT; ++i) {
            const curr = cache.getDeferred(TEST_ID);
            if (!curr.current && curr.isLoading) {
                ++loadingCount;
            }
        }

        expect(loaderFn).toHaveBeenCalledTimes(1);
        expect(loadingCount).toBe(COUNT);

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
        expect(Array.from(cache.keys(true))).toStrictEqual(['123']);
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
        expect(Array.from(cache.keysParsed(true)!)).toStrictEqual(filler.map((_, i) => i));

        cache.invalidate(1);

        expect(cache.hasKey(1)).toBe(false);

        cache.updateValueDirectly(1, getRes(1));
        expect(cache.hasKey(1)).toBe(true);

        const def = cache.getDeferred(1);
        expect(def.current).not.toBeUndefined();
        expect(def.isLoading).toBeFalsy();
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
            .setLoggerFactory(createLogger, '')
            .useBatching(async _ids => {
                await setTimeoutAsync(100);
                throw new Error('Batch fetch failed');
            });

        await expect(Promise.all([cache.get(1), cache.get(2)])).resolves.toStrictEqual([undefined, undefined]);

        cache.useBatching(null!);

        await expect(cache.get(3)).resolves.toBeUndefined();
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
        cache.setLogger(logger);

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

    it('continuos batching', async () => {
        const getRes = (id: string | number) => ({ id });

        const fetcher = vi.fn(async (id: string | number) => {
            await setTimeoutAsync(10);
            return getRes(id);
        });

        const cache = new PromiseCache(
            fetcher,
            id => id.toString(),
            id => +id,
        );

        const batchLoader = vi.fn(async (ids: number[]) => {
            await setTimeoutAsync(50);
            return ids.map(getRes);
        });

        cache.useBatching(batchLoader, 50);

        // timings should be set in a way so there should be few batches

        const doRequests = (base = 1, delay = 10) => {
            const ids = Array.from({ length: 10 }).map((_, i) => i + base);

            const results = Promise.all(
                ids.map(async id => {
                    await setTimeoutAsync(delay);
                    return cache.get(id);
                }),
            );

            return { ids, results };
        };

        const { ids: ids1, results: results1 } = doRequests(1);

        // Wait for first batch to complete:
        // - 100ms for all requests to queue (10ms * 10)
        // - 50ms for batch delay
        // - 50ms for batch processing
        // - 10ms buffer
        await setTimeoutAsync(210);

        const { ids: ids2, results: results2 } = doRequests(6);

        await expect(results1).resolves.toStrictEqual(ids1.map(getRes));
        await expect(results2).resolves.toStrictEqual(ids2.map(getRes));

        expect(batchLoader).toHaveBeenCalledTimes(2);
        expect(fetcher).toHaveBeenCalledTimes(0);
    });

    it('clears', async () => {
        const cache = new PromiseCache<number, number>(
            async id => {
                await setTimeoutAsync(200);
                return id;
            },
            id => id.toString(),
            id => +id,
        ).setLoggerFactory(createLogger, 'test');

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
        const generator = vi.fn(() => random(0, 10000));

        const cache = new PromiseCache<string, string>(
            async id => {
                await setTimeoutAsync(50);
                return `${id}_${generator()}`;
            },
        ).useInvalidationTime(100);

        const checkGenerator = (times: number) => {
            expect(generator).toHaveBeenCalledTimes(times);
            generator.mockClear();
        };

        await expect(cache.get('1')).resolves.toBeTruthy();
        checkGenerator(1);

        await expect(cache.get('1')).resolves.toBeTruthy();
        checkGenerator(0);

        await setTimeoutAsync(50);

        expect(cache.getCurrent('1')).toBeTruthy(); // value still here

        await setTimeoutAsync(51);

        expect(cache.getCurrent('1', false)).toBeUndefined(); // value invalidated

        await expect(cache.get('1')).resolves.toBeTruthy();
        checkGenerator(1);

        cache.useInvalidationTime(100, true); // switch to 'keepInstance' mode

        const previous = cache.getCurrent('1');
        expect(previous).toBeTruthy(); // value still here

        checkGenerator(0);

        await setTimeoutAsync(105);

        expect(cache.getCurrent('1', false)).toBe(previous); // value invalidated but old is returned
        expect(cache.getDeferred('1').isLoading).toBeUndefined(); // should indicate that cache is in undefined state

        const nextPromise = cache.get('1');
        await expect(nextPromise).resolves.toBeTruthy();
        await expect(nextPromise).resolves.not.toBe(previous); // should return new value (yes, random can be the same but it's very unlikely)

        checkGenerator(1);
    });

    // ─── New tests for added functionality ───────────────────────────────

    describe('counts', () => {
        it('cachedCount tracks resolved items', async () => {
            const cache = new PromiseCache<string, string>(
                async id => id,
            );

            expect(cache.cachedCount).toBe(0);

            await cache.get('a');
            expect(cache.cachedCount).toBe(1);

            await cache.get('b');
            expect(cache.cachedCount).toBe(2);

            // same key doesn't increase count
            await cache.get('a');
            expect(cache.cachedCount).toBe(2);

            cache.invalidate('a');
            expect(cache.cachedCount).toBe(1);

            cache.clear();
            expect(cache.cachedCount).toBe(0);
        });

        it('promisesCount tracks in-flight fetches', async () => {
            const cache = new PromiseCache<string, string>(
                async id => {
                    await setTimeoutAsync(100);
                    return id;
                },
            );

            expect(cache.promisesCount).toBe(0);

            const p1 = cache.get('a');
            expect(cache.promisesCount).toBe(1);

            const p2 = cache.get('b');
            expect(cache.promisesCount).toBe(2);

            // same key doesn't increase count
            cache.get('a');
            expect(cache.promisesCount).toBe(2);

            await Promise.all([p1, p2]);
            expect(cache.promisesCount).toBe(0);
        });

        it('loadingCount tracks loading items', async () => {
            const cache = new PromiseCache<string, string>(
                async id => {
                    await setTimeoutAsync(50);
                    return id;
                },
            );

            expect(cache.loadingCount).toBe(0);
            expect(cache.loadingCount).toBe(0); // deprecated alias

            const p1 = cache.get('a');
            expect(cache.loadingCount).toBe(1);

            const p2 = cache.get('b');
            expect(cache.loadingCount).toBe(2);

            await Promise.all([p1, p2]);
            expect(cache.loadingCount).toBe(0);
        });

        it('invalidCount tracks expired items', async () => {
            const cache = new PromiseCache<string, string>(
                async id => {
                    await setTimeoutAsync(10);
                    return id;
                },
            ).useInvalidationTime(50);

            expect(cache.invalidCount).toBe(0);

            await cache.get('a');
            await cache.get('b');
            expect(cache.invalidCount).toBe(0);

            await setTimeoutAsync(60);

            expect(cache.invalidCount).toBe(2);
        });
    });

    describe('getIsValid', () => {
        it('returns false for non-cached items', () => {
            const cache = new PromiseCache<string, string>(async id => id);
            expect(cache.getIsValid('nonexistent')).toBe(false);
        });

        it('returns true for valid cached items', async () => {
            const cache = new PromiseCache<string, string>(async id => id);
            await cache.get('a');
            expect(cache.getIsValid('a')).toBe(true);
        });

        it('returns false for expired items', async () => {
            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useInvalidationTime(50);

            await cache.get('a');
            expect(cache.getIsValid('a')).toBe(true);

            await setTimeoutAsync(60);
            expect(cache.getIsValid('a')).toBe(false);
        });

        it('returns false for callback-invalidated items', async () => {
            const invalidKeys = new Set<string>();

            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useInvalidation({
                invalidationCheck: (key) => invalidKeys.has(key),
            });

            await cache.get('a');
            await cache.get('b');

            expect(cache.getIsValid('a')).toBe(true);
            expect(cache.getIsValid('b')).toBe(true);

            invalidKeys.add('a');

            expect(cache.getIsValid('a')).toBe(false);
            expect(cache.getIsValid('b')).toBe(true);
        });
    });

    describe('useInvalidation config', () => {
        it('supports expirationMs', async () => {
            const cache = new PromiseCache<string, string>(
                async id => {
                    await setTimeoutAsync(10);
                    return id;
                },
            ).useInvalidation({ expirationMs: 50 });

            await cache.get('a');
            expect(cache.getIsValid('a')).toBe(true);

            await setTimeoutAsync(60);
            expect(cache.getIsValid('a')).toBe(false);
        });

        it('supports invalidationCheck callback with timestamp', async () => {
            let threshold = Date.now() + 100;

            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useInvalidation({
                invalidationCheck: (_key, _value, cachedAt) => cachedAt < threshold,
            });

            // Items cached before threshold are invalid
            threshold = Date.now() + 100;
            await cache.get('a');
            expect(cache.getIsValid('a')).toBe(false); // cachedAt < threshold

            // Move threshold to the past
            threshold = Date.now() - 100;
            cache.invalidate('a');
            await cache.get('a');
            expect(cache.getIsValid('a')).toBe(true); // cachedAt > threshold
        });

        it('supports keepInstance', async () => {
            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useInvalidation({ expirationMs: 50, keepInstance: true });

            await cache.get('a');
            const value = cache.getCurrent('a', false);
            expect(value).toBe('a');

            await setTimeoutAsync(60);

            // Item is invalidated but old value is kept
            expect(cache.getCurrent('a', false)).toBe('a');
            expect(cache.getIsValid('a')).toBe(false);
        });

        it('config is not destructured (supports dynamic getters)', async () => {
            let expirationMs = 50;

            const config = {
                get expirationMs() { return expirationMs; },
            };

            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useInvalidation(config);

            await cache.get('a');
            expect(cache.getIsValid('a')).toBe(true);

            await setTimeoutAsync(60);
            expect(cache.getIsValid('a')).toBe(false);

            // Change expiration dynamically
            expirationMs = 1000;
            expect(cache.getIsValid('a')).toBe(true); // now valid again because expiration is longer
        });

        it('disabling invalidation with null', async () => {
            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useInvalidation({ expirationMs: 50 });

            await cache.get('a');
            await setTimeoutAsync(60);
            expect(cache.getIsValid('a')).toBe(false);

            cache.useInvalidation(null);
            expect(cache.getIsValid('a')).toBe(true);
        });
    });

    describe('sanitize', () => {
        it('removes invalidated items and returns count', async () => {
            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useInvalidationTime(50);

            await cache.get('a');
            await cache.get('b');
            await cache.get('c');

            expect(cache.cachedCount).toBe(3);
            expect(cache.sanitize()).toBe(0); // nothing expired yet

            await setTimeoutAsync(60);

            expect(cache.invalidCount).toBe(3);
            expect(cache.sanitize()).toBe(3);
            expect(cache.cachedCount).toBe(0);
            expect(cache.invalidCount).toBe(0);
        });

        it('only removes invalid items, keeps valid ones', async () => {
            const invalidKeys = new Set<string>();

            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useInvalidation({
                invalidationCheck: (key) => invalidKeys.has(key),
            });

            await cache.get('a');
            await cache.get('b');
            await cache.get('c');

            invalidKeys.add('a');
            invalidKeys.add('c');

            expect(cache.sanitize()).toBe(2);
            expect(cache.cachedCount).toBe(1);
            expect(cache.hasKey('b')).toBe(true);
            expect(cache.hasKey('a')).toBe(false);
            expect(cache.hasKey('c')).toBe(false);
        });
    });

    describe('error tracking', () => {
        it('stores and retrieves errors per key', async () => {
            const fetchError = new Error('Fetch failed');

            const cache = new PromiseCache<string, string>(
                async id => {
                    if (id === 'fail') throw fetchError;
                    return id;
                },
            );

            // No error initially
            expect(cache.getLastError('fail')).toBeNull();

            await cache.get('fail');
            expect(cache.getLastError('fail')).toBe(fetchError);

            // Successful fetch has no error
            await cache.get('ok');
            expect(cache.getLastError('ok')).toBeNull();
        });

        it('DeferredGetter exposes error', async () => {
            const fetchError = new Error('Deferred error');

            const cache = new PromiseCache<string, string>(
                async id => {
                    if (id === 'fail') throw fetchError;
                    return id;
                },
            );

            const deferred = cache.getDeferred('fail');
            expect(deferred.error).toBeNull();

            await deferred.promise;
            expect(deferred.error).toBe(fetchError);
        });

        it('error is cleared on successful re-fetch', async () => {
            let shouldFail = true;

            const cache = new PromiseCache<string, string>(
                async id => {
                    if (shouldFail) throw new Error('fail');
                    return id;
                },
            ).useInvalidationTime(50);

            await cache.get('a');
            expect(cache.getLastError('a')).toBeInstanceOf(Error);

            shouldFail = false;
            await setTimeoutAsync(60);

            await cache.get('a');
            expect(cache.getLastError('a')).toBeNull();
        });

        it('error is cleared on invalidate', async () => {
            const cache = new PromiseCache<string, string>(
                async () => { throw new Error('fail'); },
            );

            await cache.get('a');
            expect(cache.getLastError('a')).toBeInstanceOf(Error);

            cache.invalidate('a');
            expect(cache.getLastError('a')).toBeNull();
        });

        it('error is cleared on clear', async () => {
            const cache = new PromiseCache<string, string>(
                async () => { throw new Error('fail'); },
            );

            await cache.get('a');
            expect(cache.getLastError('a')).toBeInstanceOf(Error);

            cache.clear();
            expect(cache.getLastError('a')).toBeNull();
        });
    });

    describe('onError callback', () => {
        it('calls onError when fetcher fails', async () => {
            const fetchError = new Error('Fetch failed');
            const onError = vi.fn();

            const cache = new PromiseCache<string, string>(
                async () => { throw fetchError; },
            ).useOnError(onError);

            await cache.get('a');

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith('a', fetchError);
        });

        it('does not call onError on success', async () => {
            const onError = vi.fn();

            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useOnError(onError);

            await cache.get('a');
            expect(onError).not.toHaveBeenCalled();
        });

        it('ignores errors thrown by onError callback', async () => {
            const cache = new PromiseCache<string, string>(
                async () => { throw new Error('fetch error'); },
            ).useOnError(() => { throw new Error('callback error'); });

            // Should not throw
            await cache.get('a');
            expect(cache.getLastError('a')).toBeInstanceOf(Error);
        });

        it('receives original key type for non-string keys', async () => {
            const onError = vi.fn();

            const cache = new PromiseCache<string, number>(
                async () => { throw new Error('fail'); },
                id => id.toString(),
                id => +id,
            ).useOnError(onError);

            await cache.get(42);

            expect(onError).toHaveBeenCalledWith(42, expect.any(Error));
        });

        it('can be removed with null', async () => {
            const onError = vi.fn();

            const cache = new PromiseCache<string, string>(
                async () => { throw new Error('fail'); },
            ).useOnError(onError);

            await cache.get('a');
            expect(onError).toHaveBeenCalledTimes(1);

            onError.mockClear();
            cache.useOnError(null);

            cache.invalidate('a');
            await cache.get('a');
            expect(onError).not.toHaveBeenCalled();
        });
    });

    describe('maxItems', () => {
        it('evicts oldest items when limit is reached', async () => {
            const cache = new PromiseCache<string, string>(
                async id => {
                    await setTimeoutAsync(5);
                    return id;
                },
            ).useInvalidation({ maxItems: 3 });

            await cache.get('a');
            await cache.get('b');
            await cache.get('c');

            expect(cache.cachedCount).toBe(3);

            // Adding 4th item should evict the oldest ('a')
            await cache.get('d');
            expect(cache.cachedCount).toBe(3);
            expect(cache.hasKey('a')).toBe(false);
            expect(cache.hasKey('b')).toBe(true);
            expect(cache.hasKey('c')).toBe(true);
            expect(cache.hasKey('d')).toBe(true);
        });

        it('evicts invalid items first before valid ones', async () => {
            const invalidKeys = new Set<string>();

            const cache = new PromiseCache<string, string>(
                async id => {
                    await setTimeoutAsync(5);
                    return id;
                },
            ).useInvalidation({
                maxItems: 3,
                invalidationCheck: (key) => invalidKeys.has(key),
            });

            await cache.get('a');
            await cache.get('b');
            await cache.get('c');

            // Mark 'b' as invalid
            invalidKeys.add('b');

            // Adding 4th item should evict 'b' (invalid) instead of 'a' (oldest valid)
            await cache.get('d');
            expect(cache.cachedCount).toBe(3);
            expect(cache.hasKey('a')).toBe(true);
            expect(cache.hasKey('b')).toBe(false); // evicted (invalid)
            expect(cache.hasKey('c')).toBe(true);
            expect(cache.hasKey('d')).toBe(true);
        });

        it('does not evict in-flight items', async () => {
            const resolvers: Record<string, () => void> = {};

            const cache = new PromiseCache<string, string>(
                async id => {
                    await new Promise<void>(resolve => { resolvers[id] = resolve; });
                    return id;
                },
            ).useInvalidation({ maxItems: 2 });

            // Start fetching 'a' and 'b'
            const pa = cache.get('a');
            const pb = cache.get('b');

            // Resolve 'a' first
            resolvers.a();
            await pa;

            // Resolve 'b'
            resolvers.b();
            await pb;

            expect(cache.cachedCount).toBe(2);

            // Start fetching 'c' - should evict 'a' (oldest resolved, not in-flight)
            const pc = cache.get('c');
            resolvers.c();
            await pc;

            expect(cache.cachedCount).toBe(2);
            expect(cache.hasKey('a')).toBe(false);
            expect(cache.hasKey('b')).toBe(true);
            expect(cache.hasKey('c')).toBe(true);
        });
    });

    describe('clear clears errors and timestamps', () => {
        it('clear resets all state including errors', async () => {
            const cache = new PromiseCache<string, string>(
                async () => { throw new Error('fail'); },
            );

            await cache.get('a');
            expect(cache.getLastError('a')).toBeInstanceOf(Error);
            expect(cache.loadingCount).toBe(0);

            cache.clear();

            expect(cache.getLastError('a')).toBeNull();
            expect(cache.cachedCount).toBe(0);
            expect(cache.promisesCount).toBe(0);
            expect(cache.loadingCount).toBe(0);
        });
    });

    describe('getLazy', () => {
        it('returns ILazyPromise interface for a cache key', async () => {
            const cache = new PromiseCache<string>(async (id) => `value-${id}`);

            const lazy = cache.getLazy('a');

            // Before fetch
            expect(lazy.hasValue).toBe(false);
            expect(lazy.currentValue).toBeUndefined();
            expect(lazy.isLoading).toBeNull(); // not started
            expect(lazy.error).toBeNull();

            // Trigger fetch via promise
            const result = await lazy.promise;
            expect(result).toBe('value-a');

            // After fetch
            expect(lazy.hasValue).toBe(true);
            expect(lazy.currentValue).toBe('value-a');
            expect(lazy.value).toBe('value-a');
            expect(lazy.isLoading).toBe(false);
            expect(lazy.error).toBeNull();
        });

        it('refresh invalidates and re-fetches', async () => {
            let counter = 0;
            const cache = new PromiseCache<number>(async () => ++counter);

            const lazy = cache.getLazy('a');
            await lazy.promise;
            expect(lazy.value).toBe(1);

            const refreshed = await lazy.refresh();
            expect(refreshed).toBe(2);
            expect(lazy.value).toBe(2);
        });

        it('exposes errors from failed fetches', async () => {
            const fetchError = new Error('getLazy fetch error');
            const cache = new PromiseCache<string>(async () => { throw fetchError; });

            const lazy = cache.getLazy('fail');
            await lazy.promise;

            expect(lazy.error).toBe(fetchError);
            expect(lazy.hasValue).toBe(false);
        });

        it('isLoading tracks fetch state', async () => {
            let resolve: (v: string) => void;
            const cache = new PromiseCache<string>(async () => new Promise<string>(r => { resolve = r; }));

            const lazy = cache.getLazy('a');
            expect(lazy.isLoading).toBeNull(); // not started

            // Trigger fetch via value access
            void lazy.value;
            expect(lazy.isLoading).toBe(true);

            resolve!('done');
            await lazy.promise;
            expect(lazy.isLoading).toBe(false);
        });
    });
});
