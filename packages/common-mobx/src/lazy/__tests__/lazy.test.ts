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

        const listener = vi.fn();
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

        expect(errorListener).toHaveBeenCalledWith(null);
        expect(l.error).toBeNull();

        errorListener.mockClear();

        expect(l.value).toBeUndefined();
        await l.promise;

        expect(errorListener).toHaveBeenCalledWith('Test error');
        expect(l.error).toBe('Test error');

        errorListener.mockClear();

        shouldFail = false;
        await l.refresh();

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

        await l.promise;
        expect(l.value).toBe('value-1');
        expect(l.error).toBeNull();
        expect(errorListener).not.toHaveBeenCalled();

        await l.refresh();
        expect(errorListener).toHaveBeenCalledWith('Refresh error');
        expect(l.error).toBe('Refresh error');
        expect(l.value).toBe('value-1');

        errorListener.mockClear();

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

        await l.promise;
        expect(l.error).toBe('Test error');
        expect(errorListener).toHaveBeenCalledWith('Test error');

        errorListener.mockClear();

        l.reset();
        expect(l.error).toBeNull();
        expect(errorListener).toHaveBeenCalledWith(null);

        cleanError();
    });

    it('extension returns LazyPromiseObservable instance', async () => {
        const original = new LazyPromiseObservable(async () => 'hello');

        const logs: string[] = [];
        const extended = original.extend({
            overrideFactory: (factory) => async (refreshing) => {
                logs.push(`loading (refreshing=${refreshing})`);
                const result = await factory(refreshing);
                logs.push(`loaded: ${result}`);
                return result;
            },
        });

        expect(extended).toBeInstanceOf(LazyPromiseObservable);
        expect(extended).toBeInstanceOf(LazyPromise);

        const valueListener = vi.fn();
        const cleanValue = reaction(() => extended.value, val => valueListener(val));

        await extended.promise;
        expect(valueListener).toHaveBeenCalledWith('hello');
        expect(logs).toEqual(['loading (refreshing=false)', 'loaded: hello']);

        cleanValue();
    });

    it('extension with shape preserves MobX observability', async () => {
        const original = new LazyPromiseObservable(async () => 42);

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

        expect(extended).toBeInstanceOf(LazyPromiseObservable);

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
            await expect(lazy.promise).resolves.toBe(10);
            expect(factoryCallCount).toBe(1);
            expect(lazy.value).toBe(10);

            ref.setValue(2);

            await setTimeoutAsync(40);

            expect(factoryCallCount).toBe(2);
            expect(lazy.value).toBe(20);
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
            await lazy.promise;
            expect(lazy.error).toBe('Fail');

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
            track: () => [ref1.value, ref2.value],
            disposer,
        }));

        disposer.add(lazy);

        try {
            await lazy.promise;
            expect(lazy.value).toBe(11);

            ref1.setValue(2);
            await setTimeoutAsync(20);
            expect(lazy.value).toBe(12);

            ref2.setValue(20);
            await setTimeoutAsync(20);
            expect(lazy.value).toBe(22);
        } finally {
            disposer.dispose();
        }
    });

    test('observing + pre-cached', async () => {
        const cache = createCache({ value: 999 });

        const ref1 = new NumberModel(0);
        const ref2 = new NumberModel(0);

        const someOtherRef = new NumberModel(0);

        const factory = vi.fn(async () => {
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

        clean();

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

        expect(extended).toBeInstanceOf(LazyPromiseObservable);
        expect(extended).toBeInstanceOf(LazyPromise);

        const listener = vi.fn();
        const clean = reaction(() => extended.value, val => listener(val));

        await extended.promise;
        expect(extended.value).toBe(42);

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

    it('derivative updates when parent changes', async () => {
        const parent = new LazyPromiseObservable<number>(async () => {
            await setTimeoutAsync(10);
            return 42;
        });

        const derivative = new LazyPromiseObservable<number>(
            async () => {
                const parentValue = parent.value;
                return (parentValue ?? 0) * 2;
            },
            { observing: true },
        );

        const derivativeListener = vi.fn();
        const cleanDerivative = reaction(
            () => derivative.value,
            val => derivativeListener(val),
        );

        try {
            expect(parent.hasValue).toBe(false);
            expect(parent.currentValue).toBeUndefined();
            expect(derivative.hasValue).toBe(false);
            expect(derivative.currentValue).toBeUndefined();

            const parentPromise = parent.promise;
            expect(parent.isLoading).toBe(true);

            await parentPromise;
            expect(parent.value).toBe(42);
            expect(parent.hasValue).toBe(true);
            expect(parent.isLoading).toBe(false);
            expect(parent.currentValue).toBe(42);

            const derivativePromise = derivative.promise;

            await derivativePromise;
            expect(derivative.value).toBe(84);
            expect(derivative.hasValue).toBe(true);
            expect(derivative.isLoading).toBe(false);
            expect(derivative.currentValue).toBe(84);

            parent.setInstance(100);
            expect(parent.value).toBe(100);
            expect(parent.currentValue).toBe(100);
            expect(parent.hasValue).toBe(true);
            expect(parent.isLoading).toBe(false);

            await setTimeoutAsync(1);

            expect(derivative.value).toBe(200);
            expect(derivative.currentValue).toBe(200);
            expect(derivative.hasValue).toBe(true);
            expect(derivative.isLoading).toBe(false);
            expect(derivativeListener).toHaveBeenCalledWith(200);
            derivativeListener.mockClear();

            parent.reset();
            expect(parent.hasValue).toBe(false);
            expect(parent.currentValue).toBeUndefined();

            await setTimeoutAsync(1);

            await parent.promise;
            expect(parent.value).toBe(42);
            expect(parent.currentValue).toBe(42);
            expect(parent.hasValue).toBe(true);

            await setTimeoutAsync(20);

            expect(derivative.value).toBe(84);
            expect(derivative.currentValue).toBe(84);
            expect(derivative.hasValue).toBe(true);
            expect(derivativeListener).toHaveBeenCalledWith(84);
            derivativeListener.mockClear();

            let refreshCount = 1;
            const parentWithRefresh = new LazyPromiseObservable<number>(async () => {
                await setTimeoutAsync(50);
                return ++refreshCount * 10;
            });

            const derivativeFromRefresh = new LazyPromiseObservable<number>(
                async () => {
                    const val = parentWithRefresh.value;
                    await setTimeoutAsync(20);
                    return (val ?? 0) + 1;
                },
                { observing: true },
            );

            expect(parentWithRefresh.hasValue).toBe(false);
            expect(parentWithRefresh.currentValue).toBeUndefined();
            expect(derivativeFromRefresh.hasValue).toBe(false);
            expect(derivativeFromRefresh.currentValue).toBeUndefined();

            await parentWithRefresh.promise;
            expect(parentWithRefresh.value).toBe(20);
            expect(parentWithRefresh.currentValue).toBe(20);
            expect(parentWithRefresh.hasValue).toBe(true);
            expect(parentWithRefresh.isLoading).toBe(false);

            await derivativeFromRefresh.promise;
            expect(derivativeFromRefresh.value).toBe(21);
            expect(derivativeFromRefresh.currentValue).toBe(21);
            expect(derivativeFromRefresh.hasValue).toBe(true);
            expect(derivativeFromRefresh.isLoading).toBe(false);

            await parentWithRefresh.refresh();
            expect(parentWithRefresh.value).toBe(30);
            expect(parentWithRefresh.currentValue).toBe(30);
            expect(parentWithRefresh.hasValue).toBe(true);
            expect(parentWithRefresh.isLoading).toBe(false);

            await setTimeoutAsync(100);

            expect(derivativeFromRefresh.value).toBe(31);
            expect(derivativeFromRefresh.currentValue).toBe(31);
            expect(derivativeFromRefresh.hasValue).toBe(true);
            expect(derivativeFromRefresh.isLoading).toBe(false);
            expect(derivativeFromRefresh.currentValue).toBe(31);
            expect(derivativeFromRefresh.hasValue).toBe(true);
            expect(derivativeFromRefresh.isLoading).toBe(false);
        } finally {
            cleanDerivative();
        }
    });

    it('derivative works independently without exposing parent', async () => {
        const createDerivative = () => {
            const parent = new LazyPromiseObservable<number>(async () => {
                await setTimeoutAsync(10);
                return 100;
            });

            const derivative = new LazyPromiseObservable<number>(
                async () => {
                    // Must await parent.promise first, then read parent.value
                    // to ensure parent loads AND establish MobX reactivity tracking
                    if (!parent.hasValue) {
                        await parent.promise;
                    }
                    const val = parent.value ?? 0;
                    return val * 2;
                },
                { observing: true },
            );

            return {
                derivative,
                updateParent: (newValue: number) => parent.setInstance(newValue),
                refreshParent: () => parent.refresh(),
                resetParent: () => parent.reset(),
            };
        };

        const { derivative, updateParent, refreshParent, resetParent } = createDerivative();

        const derivativeListener = vi.fn();
        const clean = reaction(() => derivative.value, val => derivativeListener(val));

        try {
            expect(derivative.hasValue).toBe(false);

            await derivative.promise;
            expect(derivative.value).toBe(200);
            expect(derivative.hasValue).toBe(true);

            updateParent(50);

            await setTimeoutAsync(30);

            expect(derivative.value).toBe(50 * 2);
            expect(derivativeListener).toHaveBeenCalledWith(50 * 2);
            derivativeListener.mockClear();

            refreshParent();

            await setTimeoutAsync(40);

            expect(derivative.value).toBe(100 * 2);
            expect(derivativeListener).toHaveBeenCalledWith(100 * 2);
            derivativeListener.mockClear();

            resetParent();

            await setTimeoutAsync(5);

            await derivative.promise;

            expect(derivative.value).toBe(100 * 2);
            expect(derivative.hasValue).toBe(true);

        } finally {
            clean();
        }
    });

    it('observing: handles reaction disposal during factory execution', async () => {
        const ref = new NumberModel(1);
        const disposer = new Disposer();

        const lazy = new LazyPromiseObservable(async () => {
            const value = ref.value;
            await setTimeoutAsync(50);
            return value * 10;
        }, { observing: { disposer } });

        await expect(lazy.promise).resolves.toBe(10);

        disposer.dispose();

        ref.setValue(2);

        await expect(lazy.refresh()).resolves.toBe(20);
    });
});
