
import { LazyPromise } from '../promise.js';

describe('LazyPromise refresh', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('refresh method', async () => {
        let counter = 0;
        const factory = vi.fn(async (refreshing?: boolean) => {
            await new Promise(r => setTimeout(r, 10));
            counter++;
            return { value: counter, refreshing };
        });

        const lazy = new LazyPromise(factory);

        const p = lazy.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(lazy.value?.value).toBe(1);
        expect(lazy.value?.refreshing).toBe(false);
        expect(counter).toBe(1);

        expect(factory).toHaveBeenCalledExactlyOnceWith(false);
        factory.mockClear();

        const refreshPromise = lazy.refresh();
        await vi.advanceTimersByTimeAsync(10);
        const refreshResult = await refreshPromise;
        expect(factory).toHaveBeenCalledExactlyOnceWith(true);
        factory.mockClear();

        expect(refreshResult.refreshing).toBe(true);
        expect(refreshResult.value).toBe(2);
        expect(lazy.value?.value).toBe(2);
        expect(lazy.value?.refreshing).toBe(true);
        expect(counter).toBe(2);

        const refresh1 = lazy.refresh();
        const refresh2 = lazy.refresh();
        const refresh3 = lazy.refresh();

        await vi.advanceTimersByTimeAsync(10);
        await Promise.all([refresh1, refresh2, refresh3]);

        expect(lazy.value?.value).toBe(5);
        expect(counter).toBe(5);
    });

    test('refresh with error handling', async () => {
        let shouldFail = false;
        let counter = 0;

        const lazy = new LazyPromise(async () => {
            await new Promise(r => setTimeout(r, 10));
            counter++;
            if (shouldFail) {
                throw new Error('Refresh failed');
            }
            return { value: counter };
        });

        const p = lazy.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(lazy.value?.value).toBe(1);
        expect(lazy.error).toBeNull();

        shouldFail = true;
        const refreshPromise = lazy.refresh();
        await vi.advanceTimersByTimeAsync(10);
        const result = await refreshPromise;
        expect(counter).toBe(2);
        expect(result.value).toBe(1);
        expect(lazy.error).toBeInstanceOf(Error);
        expect(lazy.errorMessage).toBe('Refresh failed');
        expect(lazy.value?.value).toBe(1);

        shouldFail = false;
        const recoveryPromise = lazy.refresh();
        await vi.advanceTimersByTimeAsync(10);
        await recoveryPromise;
        expect(lazy.value?.value).toBe(3);
        expect(lazy.error).toBeNull();
    });

    test('refresh with sync throw in factory preserves stale value', async () => {
        let shouldFail = false;
        let counter = 0;

        // Non-async factory: throw is truly synchronous (before any promise is created)
        const lazy = new LazyPromise((refreshing) => {
            counter++;
            if (shouldFail && refreshing) {
                throw new Error('Sync refresh error');
            }
            return new Promise<{ value: number }>(r => setTimeout(() => r({ value: counter }), 10));
        });

        const p = lazy.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(lazy.value?.value).toBe(1);
        expect(lazy.error).toBeNull();

        // Sync throw during refresh
        shouldFail = true;
        const result = await lazy.refresh();
        expect(counter).toBe(2);
        expect(result.value).toBe(1); // stale value preserved
        expect(lazy.error).toBeInstanceOf(Error);
        expect(lazy.errorMessage).toBe('Sync refresh error');
        expect(lazy.value?.value).toBe(1);

        // Recovery
        shouldFail = false;
        const recoveryPromise = lazy.refresh();
        await vi.advanceTimersByTimeAsync(10);
        await recoveryPromise;
        expect(lazy.value?.value).toBe(3);
        expect(lazy.error).toBeNull();
    });

    test('sync throw during initial load', async () => {
        // Non-async factory: throw is truly synchronous
        const lazy = new LazyPromise(() => {
            throw new Error('Sync initial error');
        });

        await lazy.promise;
        expect(lazy.error).toBeInstanceOf(Error);
        expect(lazy.errorMessage).toBe('Sync initial error');
        expect(lazy.hasValue).toBeTrue();
        expect(lazy.value).toBeUndefined();
    });

    test('refresh during initial load - refresh wins', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await new Promise(r => setTimeout(r, 50));
            return counter;
        });

        const initialPromise = lazy.promise;
        expect(lazy.isLoading).toBe(true);

        await vi.advanceTimersByTimeAsync(10);
        const refreshPromise = lazy.refresh();

        await vi.advanceTimersByTimeAsync(50);
        const [initialResult, refreshResult] = await Promise.all([initialPromise, refreshPromise]);

        expect(initialResult).toBe(2);
        expect(refreshResult).toBe(2);
        expect(lazy.value).toBe(2);
        expect(counter).toBe(2);
    });

    test('multiple concurrent refreshes - latest wins (fast-to-slow delays)', async () => {
        const delays = [100, 50, 20];
        let callIndex = 0;

        const lazy = new LazyPromise(async () => {
            const myIndex = callIndex++;
            const myDelay = delays[myIndex - 1] || 10;
            await new Promise(r => setTimeout(r, myDelay));
            return myIndex + 1;
        });

        const p = lazy.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(lazy.value).toBe(1);

        const refresh1 = lazy.refresh();
        await vi.advanceTimersByTimeAsync(5);
        const refresh2 = lazy.refresh();
        await vi.advanceTimersByTimeAsync(5);
        const refresh3 = lazy.refresh();

        await vi.advanceTimersByTimeAsync(100);
        const [r1, r2, r3] = await Promise.all([refresh1, refresh2, refresh3]);

        expect(lazy.value).toBe(4);
        expect(r3).toBe(4);
        expect(r1).toBe(4);
        expect(r2).toBe(4);
    });

    test('multiple concurrent refreshes - latest wins (slow-to-fast delays)', async () => {
        const delays = [20, 50, 100];
        let callIndex = 0;

        const lazy = new LazyPromise(async () => {
            const myIndex = callIndex++;
            const myDelay = delays[myIndex - 1] || 10;
            await new Promise(r => setTimeout(r, myDelay));
            return myIndex + 1;
        });

        const p = lazy.promise;
        await vi.advanceTimersByTimeAsync(20);
        await p;
        expect(lazy.value).toBe(1);

        const refresh1 = lazy.refresh();
        await vi.advanceTimersByTimeAsync(5);
        const refresh2 = lazy.refresh();
        await vi.advanceTimersByTimeAsync(5);
        const refresh3 = lazy.refresh();

        await vi.advanceTimersByTimeAsync(100);
        const [r1, r2, r3] = await Promise.all([refresh1, refresh2, refresh3]);

        expect(lazy.value).toBe(4);
        expect(r3).toBe(4);
        expect(r1).toBe(4);
        expect(r2).toBe(4);
    });

    test('await lazy.promise during refresh gets refreshed value', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await new Promise(r => setTimeout(r, 30));
            return counter;
        });

        const p = lazy.promise;
        await vi.advanceTimersByTimeAsync(30);
        await p;
        expect(lazy.value).toBe(1);

        const refreshPromise = lazy.refresh();

        await vi.advanceTimersByTimeAsync(5);
        const promiseResult = lazy.promise;

        await vi.advanceTimersByTimeAsync(30);
        expect(await promiseResult).toBe(2);
        expect(await refreshPromise).toBe(2);
        expect(lazy.value).toBe(2);
    });

    test('initial load during refresh joins the refresh', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await new Promise(r => setTimeout(r, 30));
            return counter;
        });

        expect(lazy.isLoading).toBeNull();
        const refreshPromise = lazy.refresh();

        await vi.advanceTimersByTimeAsync(5);
        const promiseResult = lazy.promise;

        await vi.advanceTimersByTimeAsync(30);
        expect(await promiseResult).toBe(1);
        expect(await refreshPromise).toBe(1);
        expect(counter).toBe(1);
    });

    test('concurrent load and refresh - refresh supersedes', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await new Promise(r => setTimeout(r, 50));
            return counter;
        });

        const loadPromise = lazy.promise;
        expect(lazy.isLoading).toBe(true);

        await vi.advanceTimersByTimeAsync(5);
        const refreshPromise = lazy.refresh();

        await vi.advanceTimersByTimeAsync(50);
        const [loadResult, refreshResult] = await Promise.all([loadPromise, refreshPromise]);

        expect(loadResult).toBe(2);
        expect(refreshResult).toBe(2);
        expect(lazy.value).toBe(2);
        expect(counter).toBe(2);
    });

    test('old promise reference resolves to new value after refresh', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await new Promise(r => setTimeout(r, 30));
            return counter;
        });

        const promiseRef1 = lazy.promise;
        expect(lazy.isLoading).toBe(true);

        await vi.advanceTimersByTimeAsync(10);
        lazy.refresh();

        await vi.advanceTimersByTimeAsync(30);
        const result = await promiseRef1;
        expect(result).toBe(2);

        expect(lazy.value).toBe(2);
    });

    test('multiple refreshes - all old promise refs get latest value', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await new Promise(r => setTimeout(r, 20));
            return counter;
        });

        const promiseRef1 = lazy.promise;

        await vi.advanceTimersByTimeAsync(5);
        lazy.refresh();
        const promiseRef2 = lazy.promise;

        await vi.advanceTimersByTimeAsync(5);
        lazy.refresh();
        const promiseRef3 = lazy.promise;

        await vi.advanceTimersByTimeAsync(20);
        const [result1, result2, result3] = await Promise.all([
            promiseRef1,
            promiseRef2,
            promiseRef3,
        ]);

        expect(result1).toBe(3);
        expect(result2).toBe(3);
        expect(result3).toBe(3);
        expect(lazy.value).toBe(3);
    });
});
