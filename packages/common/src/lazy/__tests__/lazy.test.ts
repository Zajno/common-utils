import { describe, test } from 'vitest';
import { setTimeoutAsync } from '../../async/timeout.js';
import { ExpireTracker } from '../../structures/expire.js';
import { Lazy } from '../lazy.js';
import { LazyPromise } from '../promise.js';

describe('Lazy', () => {
    test('simple', () => {
        const VAL = 'abc';
        const l = new Lazy(() => VAL);

        expect(l.hasValue).toBeFalse();
        expect(l.value).toBe(VAL);
        expect(l.hasValue).toBeTrue();

        l.reset();
        expect(l.hasValue).toBeFalse();
        expect(l.currentValue).toBeUndefined();
        expect(l.currentValue).toBeUndefined(); // second time still undefined

        l.prewarm();

        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(VAL);
        expect(l.currentValue).toBe(VAL);
    });

    test('with expire', async () => {
        let incrementor = 0;

        const expire = new ExpireTracker(10);

        const l = new Lazy(() => ++incrementor)
            .withExpire(expire);

        expect(l.hasValue).toBeFalse();
        expect(l.value).toBe(incrementor);
        expect(incrementor).toBe(1);
        expect(l.hasValue).toBeTrue();
        expect(expire.isExpired).toBeFalse();
        expect(expire.remainingMs).toBeLessThanOrEqual(10);

        await setTimeoutAsync(11);

        expect(expire.isExpired).toBeTrue();
        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(incrementor);
        expect(incrementor).toBe(2);
    });

    test('disposes', () => {
        {
            const l = new Lazy(() => 42);
            expect(l.value).toBe(42);
            expect(l.hasValue).toBeTrue();
            l.dispose();
            expect(l.hasValue).toBeFalse();
        }

        {
            const disposer = vi.fn();
            const l = new Lazy(() => 42)
                .withDisposer(disposer);

            expect(l.value).toBe(42);
            expect(l.hasValue).toBeTrue();

            l.dispose();
            expect(l.hasValue).toBeFalse();
            expect(disposer).toHaveBeenCalledTimes(1);
        }

        {
            const disposer = vi.fn();

            const l = new Lazy(() => ({
                value: 42,
                dispose() {
                    disposer();
                },
            }));

            expect(l.value.value).toBe(42);
            expect(l.hasValue).toBeTrue();

            l.dispose();
            expect(l.hasValue).toBeFalse();
            expect(disposer).toHaveBeenCalledTimes(1);
        }
    });
});

describe('LazyPromise', () => {

    test('simple', async () => {
        const VAL = 'abc';
        const l = new LazyPromise(() => setTimeoutAsync(100).then(() => VAL));

        expect(l.hasValue).toBeFalse();
        expect(l.currentValue).toBeUndefined();
        expect(l.isLoading).toBeNull();

        expect(l.value).toBeUndefined();
        expect(l.isLoading).toBeTrue();

        await expect(l.promise).resolves.not.toThrow();

        expect(l.hasValue).toBeTrue();
        expect(l.isLoading).toBeFalse();
        expect(l.value).toBe(VAL);
        expect(l.currentValue).toBe(VAL);

        l.dispose();
        expect(l.hasValue).toBeFalse();
    });

    test('setInstance', async () => {
        const VAL = 'abc1';
        const l = new LazyPromise(() => setTimeoutAsync(100).then(() => VAL));

        expect(l.hasValue).toBeFalse();
        expect(l.isLoading).toBeNull();

        expect(l.value).toBeUndefined();
        expect(l.isLoading).toBeTrue();

        // loading started when accessed `value` above
        const p = l.promise;

        const VAL2 = 'abc2';
        l.setInstance(VAL2);

        // both old promise and new value should be resolved to the new value
        await expect(p).resolves.toBe(VAL2);
        await expect(l.promise).resolves.toBe(VAL2);

        // after all loading
        const VAL3 = 'abc3';
        l.setInstance(VAL3);
        await expect(l.promise).resolves.toBe(VAL3);
    });

    test('with expire', async () => {
        let incrementor = 0;

        const expire = new ExpireTracker(10);

        const l = new LazyPromise(() => setTimeoutAsync(10).then(() => ++incrementor))
            .withExpire(expire);

        expect(l.hasValue).toBeFalse();
        expect(l.isLoading).toBeFalsy();

        expect(l.value).toBeUndefined();
        expect(l.isLoading).toBeTrue();

        const next = incrementor + 1;
        await expect(l.promise).resolves.toBe(next);
        expect(incrementor).toBe(next);

        expect(l.hasValue).toBeTrue();
        expect(l.isLoading).toBeFalse();
        expect(l.value).toBe(1);
        expect(expire.isExpired).toBeFalse();
        expect(expire.remainingMs).toBeLessThanOrEqual(10);

        await setTimeoutAsync(11);

        expect(expire.isExpired).toBeTrue();
        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(1); // still the same value

        await expect(l.promise).resolves.toBe(2);
        expect(incrementor).toBe(2);
        expect(expire.isExpired).toBeFalse();

        expire.expire();
        expect(expire.isExpired).toBeTrue();
        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(2); // still the same value
        await expect(l.promise).resolves.toBe(3);
        expect(incrementor).toBe(3);
        expect(expire.isExpired).toBeFalse();
        expect(l.value).toBe(3);
    });

    test('disposes', async () => {
        const disposer = vi.fn();

        const l = new LazyPromise(async () => ({
            value: 42,
            dispose() {
                disposer();
            },
        }));

        await l.promise;

        expect(l.value).toBeDefined();
        expect(l.value?.value).toBe(42);
        expect(l.hasValue).toBeTrue();

        l.dispose();
        expect(l.hasValue).toBeFalse();
        expect(disposer).toHaveBeenCalledTimes(1);
    });

    test('with initial value', async () => {
        const lazy = new LazyPromise(async () => {
            await setTimeoutAsync(10);
            return { result: 42 };
        }, { result: 10 });

        expect(lazy.hasValue).toBeFalse();
        expect(lazy.isLoading).toBeNull();

        expect(lazy.value.result).toBe(10);
        expect(lazy.isLoading).toBeTrue();

        await expect(lazy.promise).resolves.toEqual({ result: 42 });

        expect(lazy.value.result).toBe(42);
        expect(lazy.hasValue).toBeTrue();
        expect(lazy.isLoading).toBeFalse();
    });

    test('with no initial value', async () => {
        const lazy = new LazyPromise(async () => {
            await setTimeoutAsync(10);
            return { result: 42 };
        });

        expect(lazy.hasValue).toBeFalse();
        expect(lazy.isLoading).toBeNull();
        expect(lazy.currentValue).toBeUndefined();

        expect(lazy.value).toBeUndefined();
        expect(() => {
            // @ts-expect-error "lazy.value" should be undefined, so expecting error here is correct
            return lazy.value.result;
        }).toThrow();

        expect(lazy.isLoading).toBeTrue();

        await expect(lazy.promise).resolves.toEqual({ result: 42 });

        // @ts-expect-error "lazy.value" should be possibly undefined, so expecting error here is correct
        expect(lazy.value.result).toBe(42);
        expect(lazy.hasValue).toBeTrue();
        expect(lazy.isLoading).toBeFalse();
    });

});
