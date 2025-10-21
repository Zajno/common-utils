import { setTimeoutAsync } from '@zajno/common/async/timeout';
import { LazyPromise } from '@zajno/common/lazy/promise';
import { reaction } from 'mobx';

import { Disposer } from '@zajno/common/functions/disposer';
import { createCacheExtension } from '@zajno/common/lazy/extensions';
import type { IKeyedStorageSync } from '@zajno/common/storage/types.js';
import { NumberModel } from '../../viewModels/NumberModel.js';
import { createObservingExtension, LazyObservable, LazyPromiseObservable } from '../observable.js';

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

    const createCache = (initial: { value: number } | null = null) => {
        let cachedValue: { value: number } | null = initial;

        const cache = {
            getValue: vi.fn(() => cachedValue),
            setValue: vi.fn((value) => {
                cachedValue = value;
            }),
            removeValue: vi.fn(() => {
                cachedValue = null;
                return true;
            }),
            hasValue: vi.fn(() => cachedValue != null),
        } satisfies IKeyedStorageSync<{ value: number }>;

        return cache;
    };

    test('observing', async () => {

        // tracking source for model
        const ref = new NumberModel(0);

        const factory = vi.fn(async () => {
            const value = ref.value;
            await setTimeoutAsync(10);
            return { value };
        });

        const handler = vi.fn<(value: { value: number }) => void>();

        const disposer = new Disposer();

        const model = new LazyPromiseObservable(
            factory,
            {
                initial: { value: -1 },
                observing: true,
            },
        );

        disposer.add(model);

        disposer.add(
            reaction(
                () => model.value,
                value => handler(value),
                { fireImmediately: true },
            ),
        );

        try {
            assert(!!model, 'Model is expected to be defined');

            expect(handler).toHaveBeenCalledExactlyOnceWith({ value: -1 });
            handler.mockClear();

            await expect(model.promise).resolves.toEqual({ value: 0 });

            expect(factory).toHaveBeenCalledExactlyOnceWith(false);
            factory.mockClear();

            expect(handler).toHaveBeenCalledExactlyOnceWith({ value: 0 });
            handler.mockClear();

            ref.setValue(123);

            expect(factory).toHaveBeenCalledExactlyOnceWith(true);
            factory.mockClear();

            await setTimeoutAsync(15);

            expect(model.value).toEqual({ value: 123 });

            expect(handler).toHaveBeenCalledExactlyOnceWith({ value: 123 });
            handler.mockClear();
        } finally {
            disposer.dispose();
        }

        ref.setValue(456);

        await setTimeoutAsync(20);

        // should not trigger fetch since scope is destroyed
        expect(factory).not.toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalled();
    });

    test('observing: dependency change during initial load', async () => {
        const ref = new NumberModel(1);
        let factoryCallCount = 0;

        const disposer = new Disposer();

        const lazy = new LazyPromiseObservable(async () => {
            factoryCallCount++;
            const value = ref.value;
            await setTimeoutAsync(30);
            return value * 10;
        }).extend(createObservingExtension());

        disposer.add(lazy);

        try {
            // Start loading
            await expect(lazy.promise).resolves.toBe(10);
            expect(factoryCallCount).toBe(1);
            expect(lazy.value).toBe(10);

            // Change dependency after loading completes
            ref.setValue(2);

            // Wait for refresh to complete
            await setTimeoutAsync(40);

            expect(factoryCallCount).toBe(2); // Initial + refresh
            expect(lazy.value).toBe(20); // Shows result from ref=2
        } finally {
            disposer.dispose();
        }
    });

    test('observing: continues after factory error', async () => {
        const ref = new NumberModel(1);
        let shouldFail = true;

        const disposer = new Disposer();

        const lazy = new LazyPromiseObservable(async () => {
            if (shouldFail) throw new Error('Fail');
            return ref.value * 10;
        }).extend(createObservingExtension({
            track: () => ref.value,
            disposer,
        }));

        disposer.add(lazy);

        try {
            // Initial load fails
            await lazy.promise;
            expect(lazy.error).toBe('Fail');

            // Change dependency and succeed
            shouldFail = false;
            ref.setValue(2);
            await setTimeoutAsync(60);

            expect(lazy.error).toBeNull();
            expect(lazy.value).toBe(20);
        } finally {
            disposer.dispose();
        }
    });

    test('observing: multiple dependencies in single extension', async () => {
        const ref1 = new NumberModel(1);
        const ref2 = new NumberModel(10);

        const disposer = new Disposer();

        const lazy = new LazyPromiseObservable(async () => {
            await setTimeoutAsync(10);
            return ref1.value + ref2.value;
        }).extend(createObservingExtension({
            // Track multiple dependencies in one extension
            track: () => [ref1.value, ref2.value],
            disposer,
        }));

        disposer.add(lazy);

        try {
            await lazy.promise;
            expect(lazy.value).toBe(11);

            // Change ref1, should trigger refresh
            ref1.setValue(2);
            await setTimeoutAsync(20);
            expect(lazy.value).toBe(12);

            // Change ref2, should trigger refresh
            ref2.setValue(20);
            await setTimeoutAsync(20);
            expect(lazy.value).toBe(22);
        } finally {
            disposer.dispose();
        }
    });

    test('observing + pre-cached', async () => {
        // we have some initial cached value which is taken by model before reading the trackable source
        const cache = createCache({ value: 999 });

        const ref1 = new NumberModel(0);
        const ref2 = new NumberModel(0);

        // extra dependency, manually tracked
        const someOtherRef = new NumberModel(0);

        const factory = vi.fn(async () => {
            // console.log('--- Factory called ---');
            let value = ref1.value;
            if (value) {
                value += ref2.value;
            }
            await setTimeoutAsync(10);
            return { value };
        });

        const handler = vi.fn<(value: { value: number }) => void>();

        const disposer = new Disposer();

        const model = new LazyPromiseObservable(factory, undefined, { value: -1 })
            .extend(createCacheExtension(cache))
            .extend(createObservingExtension({
                track: () => [ref1.value, ref2.value, someOtherRef.value],
            }));

        disposer.add(model);

        disposer.add(
            reaction(
                () => model.value,
                value => handler(value),
                { fireImmediately: true },
            ),
        );

        try {
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ value: -1 });
            handler.mockClear();

            await expect(model.promise).resolves.toEqual({ value: 999 });

            expect(model.error).toBeNull();

            // value was pre-cached so it should be used first
            expect(factory).not.toHaveBeenCalled();
            factory.mockClear();

            expect(model.value).toEqual({ value: 999 });

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ value: 999 });
            handler.mockClear();

            ref1.setValue(123);

            expect(factory).toHaveBeenCalledTimes(1);
            expect(factory).toHaveBeenCalledWith(true);
            factory.mockClear();

            await setTimeoutAsync(15);

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ value: 123 });
            handler.mockClear();

            // triggering another change while the fetch is in progress
            ref2.setValue(1);

            expect(factory).toHaveBeenCalledTimes(1);
            expect(factory).toHaveBeenCalledWith(true);

            factory.mockClear();

            await setTimeoutAsync(15);

            expect(model.value).toEqual({ value: 124 });

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ value: 124 });
            handler.mockClear();

            ref2.setValue(456);

            expect(factory).toHaveBeenCalledTimes(1);
            expect(factory).toHaveBeenCalledWith(true);

            factory.mockClear();

            await setTimeoutAsync(15);

            expect(model.value).toEqual({ value: 579 });

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ value: 579 });
            handler.mockClear();

            // triggering re-fetch when unrelated but tracked value changes
            someOtherRef.setValue(111);

            expect(factory).toHaveBeenCalledTimes(1);
            expect(factory).toHaveBeenCalledWith(true);

            factory.mockClear();

            await setTimeoutAsync(15);

            expect(model.value).toEqual({ value: 579 });

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ value: 579 });
            handler.mockClear();
        } finally {
            disposer.dispose();
        }

        ref1.setValue(789);
        ref2.setValue(1);

        await setTimeoutAsync(60);

        // should not trigger fetch since scope is destroyed
        expect(factory).not.toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalled();
    });

    it('dispose works with extensions', async () => {
        const disposeCalls: string[] = [];

        const lazy = new LazyPromiseObservable<string>(async () => {
            await setTimeoutAsync(50);
            return 'value';
        });

        const extended = lazy.extend({
            overrideFactory: (original) => async (refreshing) => {
                const result = await original(refreshing);
                return result + '-modified';
            },
            dispose: () => {
                disposeCalls.push('extension-disposed');
            },
        });

        const listener = vi.fn();
        const clean = reaction(() => extended.value, val => listener(val), { fireImmediately: true });

        expect(listener).toHaveBeenCalledWith(undefined);
        listener.mockClear();

        await extended.promise;
        expect(extended.value).toBe('value-modified');
        expect(listener).toHaveBeenCalledWith('value-modified');

        // Clean up reaction before dispose to avoid triggering reactions
        clean();

        // Dispose should call extension disposer and reset state
        extended.dispose();

        expect(disposeCalls).toEqual(['extension-disposed']);
        expect(extended.currentValue).toBeUndefined();
        expect(extended.hasValue).toBe(false);
        expect(extended.isLoading).toBeNull();
    });

    it('preserves type with extensions', async () => {
        const lazy = new LazyPromiseObservable<number>(async () => 42);

        const disposeCalls: string[] = [];

        const extended = lazy.extend({
            dispose: () => {
                disposeCalls.push('disposed');
            },
        });

        // Should still be LazyPromiseObservable (MobX observable)
        expect(extended).toBeInstanceOf(LazyPromiseObservable);
        expect(extended).toBeInstanceOf(LazyPromise);

        const listener = vi.fn();
        const clean = reaction(() => extended.value, val => listener(val));

        await extended.promise;
        expect(extended.value).toBe(42);

        // Clean up reaction before dispose
        clean();

        extended.dispose();
        expect(disposeCalls).toEqual(['disposed']);
    });

    it('cannot have multiple observing extensions', async () => {
        const lazy = new LazyPromiseObservable<number>(async () => 1);

        const firstExtension = lazy.extend(
            createObservingExtension(),
        );

        expect(firstExtension).toBeInstanceOf(LazyPromiseObservable);

        expect(() => {
            firstExtension.extend(
                createObservingExtension(),
            );
        }).toThrowError('Observing extension already applied to this instance');
    });
});
