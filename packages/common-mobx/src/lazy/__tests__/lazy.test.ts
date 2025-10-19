import { reaction } from 'mobx';
import { setTimeoutAsync } from '@zajno/common/async/timeout';
import { LazyPromise } from '@zajno/common/lazy/promise';

import { LazyObservable, LazyPromiseObservable } from '../observable.js';

describe('Lazy', () => {

    it('observable', () => {
        const createObj = () => ({ str: 'abc' });
        const l = new LazyObservable(() => createObj());

        const listener = vi.fn();

        const clean = reaction(() => l.value, vv => listener(vv), { fireImmediately: true });

        expect(listener).toHaveBeenCalledWith(createObj());

        listener.mockClear();

        l.reset();

        expect(listener).toHaveBeenCalledWith(createObj());

        clean();
    });
});

describe('LazyPromise', () => {

    it('observable', async () => {
        const VAL = 'abc';
        const l = new LazyPromiseObservable(() => setTimeoutAsync(200).then(() => VAL));

        expect(l.hasValue).toBe(false);
        expect(l.isLoading).toBeNull();

        expect(l.value).toBeUndefined();
        expect(l.isLoading).toBe(true);
        expect(l.promise).not.toBeNull();

        const listener = vi.fn().mockImplementation(() => { /* no-op */ });
        const clean = reaction(() => l.value, vv => listener(vv), { fireImmediately: true });

        expect(listener).toHaveBeenCalledWith(undefined);

        await expect(l.promise).resolves.not.toThrow();

        expect(listener).toHaveBeenCalledWith(VAL);

        expect(l.hasValue).toBe(true);
        expect(l.isLoading).toBe(false);
        expect(l.value).toBe(VAL);

        clean();
    });

    it('error is observable', async () => {
        let shouldFail = true;
        const l = new LazyPromiseObservable<string>(async () => {
            await setTimeoutAsync(50);
            if (shouldFail) {
                throw new Error('Test error');
            }
            return 'success';
        });

        const errorListener = vi.fn();
        const cleanError = reaction(() => l.error, err => errorListener(err), { fireImmediately: true });

        // Initially no error
        expect(errorListener).toHaveBeenCalledWith(null);
        expect(l.error).toBeNull();

        errorListener.mockClear();

        // Trigger loading
        expect(l.value).toBeUndefined();
        await l.promise;

        // Error should be set and observable
        expect(errorListener).toHaveBeenCalledWith('Test error');
        expect(l.error).toBe('Test error');

        errorListener.mockClear();

        // Refresh successfully
        shouldFail = false;
        await l.refresh();

        // Error should be cleared and observable
        expect(errorListener).toHaveBeenCalledWith(null);
        expect(l.error).toBeNull();
        expect(l.value).toBe('success');

        cleanError();
    });

    it('error observable on refresh', async () => {
        let counter = 0;
        const l = new LazyPromiseObservable<string>(async () => {
            await setTimeoutAsync(50);
            counter++;
            if (counter === 2) {
                throw new Error('Refresh error');
            }
            return `value-${counter}`;
        });

        const errorListener = vi.fn();
        const valueListener = vi.fn();

        const cleanError = reaction(() => l.error, err => errorListener(err));
        const cleanValue = reaction(() => l.value, val => valueListener(val));

        // Initial successful load
        await l.promise;
        expect(l.value).toBe('value-1');
        expect(l.error).toBeNull();
        expect(errorListener).not.toHaveBeenCalled();

        // Refresh with error
        await l.refresh();
        expect(errorListener).toHaveBeenCalledWith('Refresh error');
        expect(l.error).toBe('Refresh error');
        expect(l.value).toBe('value-1'); // keeps old value

        errorListener.mockClear();

        // Refresh successfully after error
        await l.refresh();
        expect(errorListener).toHaveBeenCalledWith(null);
        expect(l.error).toBeNull();
        expect(l.value).toBe('value-3');

        cleanError();
        cleanValue();
    });

    it('error is cleared on reset', async () => {
        const l = new LazyPromiseObservable<string>(async () => {
            await setTimeoutAsync(50);
            throw new Error('Test error');
        });

        const errorListener = vi.fn();
        const cleanError = reaction(() => l.error, err => errorListener(err), { fireImmediately: true });

        expect(errorListener).toHaveBeenCalledWith(null);
        errorListener.mockClear();

        // Trigger error
        await l.promise;
        expect(l.error).toBe('Test error');
        expect(errorListener).toHaveBeenCalledWith('Test error');

        errorListener.mockClear();

        // Reset should clear error
        l.reset();
        expect(l.error).toBeNull();
        expect(errorListener).toHaveBeenCalledWith(null);

        cleanError();
    });

    it('extension returns LazyPromiseObservable instance', async () => {
        const original = new LazyPromiseObservable(async () => 'hello');

        // Simple logging extension
        const logs: string[] = [];
        const extended = original.extend({
            overrideFactory: (factory) => async (refreshing) => {
                logs.push(`loading (refreshing=${refreshing})`);
                const result = await factory(refreshing);
                logs.push(`loaded: ${result}`);
                return result;
            },
        });

        // Extended instance should still be LazyPromiseObservable
        expect(extended).toBeInstanceOf(LazyPromiseObservable);
        expect(extended).toBeInstanceOf(LazyPromise);

        // MobX observability should work
        const valueListener = vi.fn();
        const cleanValue = reaction(() => extended.value, val => valueListener(val));

        await extended.promise;
        expect(valueListener).toHaveBeenCalledWith('hello');
        expect(logs).toEqual(['loading (refreshing=false)', 'loaded: hello']);

        cleanValue();
    });

    it('extension with shape preserves MobX observability', async () => {
        const original = new LazyPromiseObservable(async () => 42);

        // Extension that adds a custom method
        const extended = original.extend<{ double: () => number | undefined }>({
            extendShape: (instance) => {
                return Object.assign(instance, {
                    double: () => {
                        const val = instance.currentValue;
                        return val !== undefined ? val * 2 : undefined;
                    },
                });
            },
        });

        // Should still be LazyPromiseObservable
        expect(extended).toBeInstanceOf(LazyPromiseObservable);

        // MobX observability should work for both original and extended properties
        const valueListener = vi.fn();
        const errorListener = vi.fn();

        const cleanValue = reaction(() => extended.value, val => valueListener(val));
        const cleanError = reaction(() => extended.error, err => errorListener(err));

        await extended.promise;
        expect(valueListener).toHaveBeenCalledWith(42);
        expect(extended.double()).toBe(84);

        cleanValue();
        cleanError();
    });

    it('chained extensions preserve LazyPromiseObservable type', async () => {
        const original = new LazyPromiseObservable(async () => 10);

        const logs: string[] = [];
        const withLogging = original.extend({
            overrideFactory: (factory) => async (refreshing) => {
                logs.push('loading');
                return factory(refreshing);
            },
        });

        const withRetry = withLogging.extend({
            overrideFactory: (factory) => async (refreshing) => {
                try {
                    return await factory(refreshing);
                } catch {
                    logs.push('retrying');
                    return factory(refreshing);
                }
            },
        });

        // All should be LazyPromiseObservable
        expect(withLogging).toBeInstanceOf(LazyPromiseObservable);
        expect(withRetry).toBeInstanceOf(LazyPromiseObservable);

        const listener = vi.fn();
        const clean = reaction(() => withRetry.value, val => listener(val));

        await withRetry.promise;
        expect(listener).toHaveBeenCalledWith(10);
        expect(logs).toEqual(['loading']);

        clean();
    });
});
