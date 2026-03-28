import { Disposer } from '@zajno/common/functions/disposer';
import { PromiseCacheObservable } from '../promiseCache.js';
import { reaction, runInAction } from 'mobx';

describe('PromiseCache observable', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('reacts on change', async () => {
        const cache = new PromiseCacheObservable(
            async (id: string) => id,
        );

        const handler = vi.fn();
        const checkHandler = (v: string | undefined) => {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(v);

            handler.mockClear();
        };

        const disposer = new Disposer();
        disposer.add(
            reaction(
                () => cache.getCurrent('1', false),
                v => handler(v),
                { fireImmediately: true },
            ),
        );

        checkHandler(undefined);

        await expect(cache.getDeferred('1').promise).resolves.toBe('1');

        checkHandler('1');

        cache.clear();

        checkHandler(undefined);

        cache.set('1', '2');

        checkHandler('2');

        disposer.dispose();
    });

    it('inner observable', async () => {
        const cache = new PromiseCacheObservable(
            async (id: string) => ({ id }),
        ).useObserveItems(true);

        const handler = vi.fn();
        const checkHandler = (res: any) => {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(res);

            handler.mockClear();
        };

        const disposer = new Disposer();
        disposer.add(
            reaction(
                () => cache.getCurrent('1', false)?.id,
                v => handler(v),
                { fireImmediately: true },
            ),
        );

        checkHandler(undefined);

        await expect(cache.getDeferred('1').promise).resolves.toStrictEqual({ id: '1' });

        checkHandler('1');

        const item = cache.getCurrent('1', false);
        expect(item).toBeDefined();

        runInAction(() => {
            item!.id = '2';
        });

        checkHandler('2');

        disposer.dispose();
    });

    it('handles invalidation by timeout', async () => {
        const fetcher = vi.fn(async (id: string) => {
            // Simulate async work with a 10ms delay
            await new Promise<void>(resolve => setTimeout(resolve, 10));
            return { id };
        });

        const cache = new PromiseCacheObservable(fetcher)
            .useInvalidationTime(10)
            // .useLogger('test')
            ;

        const handler = vi.fn();
        const checkHandler = (res: any) => {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(res);

            handler.mockClear();
        };

        const disposer = new Disposer();
        disposer.add(
            reaction(
                () => cache.getCurrent('1', false),
                v => handler(v?.id),
                { fireImmediately: true },
            ),
        );

        checkHandler(undefined);

        const deferred = cache.getDeferred('1');

        // PASS 1 - initial fetch
        {
            // isLoading should be undefined when item is empty
            expect(deferred.isLoading).toBe(undefined);
            expect(deferred.current).toBeUndefined();
            // here isLoading should be true since fetch is in progress
            expect(deferred.isLoading).toBe(true);

            // Advance past the 10ms fetcher delay
            await vi.advanceTimersByTimeAsync(10);

            expect(deferred.current).toStrictEqual({ id: '1' });
            expect(deferred.isLoading).toBe(false);

            expect(fetcher).toHaveBeenCalledTimes(1);
            fetcher.mockClear();

            checkHandler('1');
        }

        // WAITING FOR INVALIDATION (advance past the 10ms invalidation threshold)
        await vi.advanceTimersByTimeAsync(20);

        // PASS 2 - re-fetch after invalidation
        {
            // isLoading should be undefined when item is invalidated
            expect(deferred.isLoading).toBe(undefined);
            // Stale value is always kept (stale-while-revalidate)
            expect(deferred.current).toStrictEqual({ id: '1' });
            // here isLoading should be true since fetch is in progress
            expect(deferred.isLoading).toBe(true);

            // Advance past the 10ms fetcher delay
            await vi.advanceTimersByTimeAsync(10);

            expect(deferred.current).toStrictEqual({ id: '1' });
            expect(deferred.isLoading).toBe(false);

            expect(fetcher).toHaveBeenCalledTimes(1);
            fetcher.mockClear();

            checkHandler('1');
        }

        disposer.dispose();
    });

    it('handles invalidation by timeout (stale-while-revalidate)', async () => {
        const fetcher = vi.fn(async (id: string) => ({ id }));

        const cache = new PromiseCacheObservable(fetcher)
            .useInvalidationTime(10)
        ;

        const handler = vi.fn();
        const checkHandler = (res: any) => {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(res);

            handler.mockClear();
        };

        const disposer = new Disposer();
        disposer.add(
            reaction(
                () => cache.getCurrent('1', false),
                v => handler(v?.id),
                { fireImmediately: true },
            ),
        );

        checkHandler(undefined);

        const deferred = cache.getDeferred('1');

        // PASS 1 - initial fetch
        // isLoading should be undefined when item is empty
        expect(deferred.isLoading).toBe(undefined);
        expect(deferred.current).toBeUndefined();
        // here isLoading should be true since fetch is in progress
        expect(deferred.isLoading).toBe(true);

        // Let the microtask-based fetcher resolve
        await vi.advanceTimersByTimeAsync(0);

        expect(deferred.current).toStrictEqual({ id: '1' });
        expect(deferred.isLoading).toBe(false);

        expect(fetcher).toHaveBeenCalledTimes(1);
        fetcher.mockClear();

        checkHandler('1');

        // WAITING FOR INVALIDATION (advance past the 10ms invalidation threshold)
        await vi.advanceTimersByTimeAsync(20);

        // PASS 2 - re-fetch after invalidation

        expect(deferred.isLoading).toBe(undefined);
        expect(fetcher).toHaveBeenCalledTimes(0);

        expect(deferred.current).toStrictEqual({ id: '1' }); // returning old value

        expect(handler).toHaveBeenCalledTimes(0); // no reaction

        // here isLoading should be true since fetch is in progress
        expect(deferred.isLoading).toBe(true);

        // Let the microtask-based fetcher resolve
        await vi.advanceTimersByTimeAsync(0);

        expect(deferred.current).toStrictEqual({ id: '1' });
        expect(deferred.isLoading).toBe(false);

        expect(fetcher).toHaveBeenCalledTimes(1);
        fetcher.mockClear();

        checkHandler('1');

        disposer.dispose();
    });

    // ─── New tests for added functionality ───────────────────────────────

    it('observable error tracking', async () => {
        const fetchError = new Error('Observable fetch error');

        const cache = new PromiseCacheObservable<string, string>(
            async (id) => {
                if (id === 'fail') throw fetchError;
                return id;
            },
        );

        const errorHandler = vi.fn();
        const disposer = new Disposer();

        disposer.add(
            reaction(
                () => cache.getLastError('fail'),
                v => errorHandler(v),
                { fireImmediately: true },
            ),
        );

        // Initially no error
        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(errorHandler).toHaveBeenCalledWith(null);
        errorHandler.mockClear();

        // Trigger fetch that will fail
        await cache.get('fail');

        // Error should be observable
        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(errorHandler).toHaveBeenCalledWith(fetchError);
        errorHandler.mockClear();

        // Clear should remove error
        cache.clear();
        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(errorHandler).toHaveBeenCalledWith(null);

        disposer.dispose();
    });

    it('observable counts', async () => {
        const cache = new PromiseCacheObservable<string, string>(
            async (id) => {
                await new Promise<void>(resolve => setTimeout(resolve, 10));
                return id;
            },
        );

        expect(cache.loadingCount).toBe(0);
        expect(cache.cachedCount).toBe(0);
        expect(cache.promisesCount).toBe(0);

        const loadingHandler = vi.fn();
        const disposer = new Disposer();

        disposer.add(
            reaction(
                () => cache.loadingCount,
                v => loadingHandler(v),
            ),
        );

        const p = cache.get('a');
        expect(cache.loadingCount).toBe(1);
        expect(cache.promisesCount).toBe(1);

        await vi.advanceTimersByTimeAsync(10);
        await p;

        expect(cache.loadingCount).toBe(0);
        expect(cache.cachedCount).toBe(1);
        expect(cache.promisesCount).toBe(0);

        // loadingHandler should have been called for 1 -> 0 transition
        expect(loadingHandler).toHaveBeenCalledWith(0);

        disposer.dispose();
    });

    it('sanitize works as action', async () => {
        const cache = new PromiseCacheObservable<string, string>(
            async (id) => id,
        ).useInvalidationTime(10);

        await cache.get('a');
        await cache.get('b');

        expect(cache.cachedCount).toBe(2);

        await vi.advanceTimersByTimeAsync(20);

        expect(cache.invalidCount).toBe(2);

        const removed = cache.sanitize();
        expect(removed).toBe(2);
        expect(cache.cachedCount).toBe(0);
    });

    it('DeferredGetter error is observable', async () => {
        const fetchError = new Error('Deferred observable error');

        const cache = new PromiseCacheObservable<string, string>(
            async () => { throw fetchError; },
        );

        const deferred = cache.getDeferred('fail');
        expect(deferred.error).toBeNull();

        await deferred.promise;
        expect(deferred.error).toBe(fetchError);
    });

    it('refresh triggers observable reactions', async () => {
        let counter = 0;
        const cache = new PromiseCacheObservable<number, string>(
            async () => {
                await new Promise<void>(resolve => setTimeout(resolve, 10));
                return ++counter;
            },
        );

        const valueHandler = vi.fn();
        const disposer = new Disposer();

        // Initial fetch
        const p1 = cache.get('a');
        await vi.advanceTimersByTimeAsync(10);
        await p1;
        expect(cache.getCurrent('a', false)).toBe(1);

        // Set up reaction on the cached value
        disposer.add(
            reaction(
                () => cache.getCurrent('a', false),
                v => valueHandler(v),
            ),
        );

        // Refresh — should trigger the reaction when the new value arrives
        const refreshPromise = cache.refresh('a');

        // Stale value still available during refresh
        expect(cache.getCurrent('a', false)).toBe(1);

        await vi.advanceTimersByTimeAsync(10);
        await refreshPromise;

        expect(cache.getCurrent('a', false)).toBe(2);
        expect(valueHandler).toHaveBeenCalledTimes(1);
        expect(valueHandler).toHaveBeenCalledWith(2);

        disposer.dispose();
    });

    it('getLazy().refresh() triggers observable reactions', async () => {
        let counter = 0;
        const cache = new PromiseCacheObservable<number, string>(
            async () => {
                await new Promise<void>(resolve => setTimeout(resolve, 10));
                return ++counter;
            },
        );

        const lazy = cache.getLazy('a');

        // Initial fetch
        const p1 = lazy.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p1;
        expect(lazy.value).toBe(1);

        const valueHandler = vi.fn();
        const disposer = new Disposer();

        disposer.add(
            reaction(
                () => cache.getCurrent('a', false),
                v => valueHandler(v),
            ),
        );

        // Refresh via lazy handle
        const refreshPromise = lazy.refresh();
        expect(lazy.currentValue).toBe(1); // stale value

        await vi.advanceTimersByTimeAsync(10);
        const refreshed = await refreshPromise;

        expect(refreshed).toBe(2);
        expect(lazy.value).toBe(2);
        expect(valueHandler).toHaveBeenCalledTimes(1);
        expect(valueHandler).toHaveBeenCalledWith(2);

        disposer.dispose();
    });
});
