
import { PromiseCache } from '../index.js';

describe('PromiseCache getLazy', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns ILazyPromise interface for a cache key', async () => {
        const cache = new PromiseCache<string>(async (id) => `value-${id}`);

        const lazy = cache.getLazy('a');

        // Before fetch
        expect(lazy.hasValue).toBe(false);
        expect(lazy.currentValue).toBeUndefined();
        expect(lazy.isLoading).toBeNull();
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

    it('value triggers fetch', async () => {
        const fetcher = vi.fn(async (id: string) => `value-${id}`);
        const cache = new PromiseCache<string>(fetcher);

        const lazy = cache.getLazy('a');

        // Access value — should trigger fetch
        void lazy.value;
        expect(fetcher).toHaveBeenCalledTimes(1);

        await lazy.promise;
        expect(lazy.value).toBe('value-a');
    });

    it('currentValue does not trigger fetch', async () => {
        const fetcher = vi.fn(async (id: string) => `value-${id}`);
        const cache = new PromiseCache<string>(fetcher);

        const lazy = cache.getLazy('a');

        // Access currentValue — should NOT trigger fetch
        expect(lazy.currentValue).toBeUndefined();
        expect(fetcher).not.toHaveBeenCalled();
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

    it('refresh works after error', async () => {
        let shouldFail = true;
        const cache = new PromiseCache<string>(async (id) => {
            if (shouldFail) throw new Error('fail');
            return `value-${id}`;
        });

        const lazy = cache.getLazy('a');
        await lazy.promise;

        expect(lazy.error).toBeInstanceOf(Error);
        expect(lazy.hasValue).toBe(false);

        shouldFail = false;
        const result = await lazy.refresh();
        expect(result).toBe('value-a');
        expect(lazy.error).toBeNull();
        expect(lazy.hasValue).toBe(true);
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

    it('errorMessage returns formatted error string', async () => {
        const cache = new PromiseCache<string>(async () => { throw new Error('fail'); });

        const lazy = cache.getLazy('a');
        expect(lazy.errorMessage).toBeNull();

        await lazy.promise;
        // errorMessage formats the error for display (deprecated, use .error instead)
        expect(lazy.errorMessage).toBe('fail');
        expect(lazy.error).toBeInstanceOf(Error);
    });

    it('isLoading returns null after invalidation', async () => {
        const cache = new PromiseCache<string>(async id => id)
            .useInvalidationTime(50);

        const lazy = cache.getLazy('a');
        await lazy.promise;
        expect(lazy.isLoading).toBe(false);

        await vi.advanceTimersByTimeAsync(60);
        expect(lazy.isLoading).toBeNull(); // invalidated = not started
    });

    describe('counts', () => {
        it('cachedCount tracks resolved items', async () => {
            const cache = new PromiseCache<string, string>(async id => id);

            expect(cache.cachedCount).toBe(0);

            await cache.get('a');
            expect(cache.cachedCount).toBe(1);

            await cache.get('b');
            expect(cache.cachedCount).toBe(2);

            await cache.get('a');
            expect(cache.cachedCount).toBe(2);

            cache.invalidate('a');
            expect(cache.cachedCount).toBe(1);

            cache.clear();
            expect(cache.cachedCount).toBe(0);
        });

        it('promisesCount tracks in-flight fetches', async () => {
            const resolvers: Record<string, (v: string) => void> = {};
            const cache = new PromiseCache<string, string>(
                async id => new Promise(r => { resolvers[id] = r; }),
            );

            expect(cache.promisesCount).toBe(0);

            const p1 = cache.get('a');
            expect(cache.promisesCount).toBe(1);

            const p2 = cache.get('b');
            expect(cache.promisesCount).toBe(2);

            cache.get('a');
            expect(cache.promisesCount).toBe(2);

            resolvers.a('a');
            resolvers.b('b');
            await Promise.all([p1, p2]);
            expect(cache.promisesCount).toBe(0);
        });

        it('loadingCount tracks loading items', async () => {
            const resolvers: Record<string, (v: string) => void> = {};
            const cache = new PromiseCache<string, string>(
                async id => new Promise(r => { resolvers[id] = r; }),
            );

            expect(cache.loadingCount).toBe(0);

            const p1 = cache.get('a');
            expect(cache.loadingCount).toBe(1);

            const p2 = cache.get('b');
            expect(cache.loadingCount).toBe(2);

            resolvers.a('a');
            resolvers.b('b');
            await Promise.all([p1, p2]);
            expect(cache.loadingCount).toBe(0);
        });

        it('invalidCount tracks expired items', async () => {
            const cache = new PromiseCache<string, string>(
                async id => id,
            ).useInvalidationTime(50);

            expect(cache.invalidCount).toBe(0);

            await cache.get('a');
            await cache.get('b');

            expect(cache.invalidCount).toBe(0);

            await vi.advanceTimersByTimeAsync(60);

            expect(cache.invalidCount).toBe(2);
        });
    });
});
