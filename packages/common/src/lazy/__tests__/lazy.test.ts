import { describe, test } from 'vitest';
import { setTimeoutAsync } from '../../async/timeout.js';
import { ExpireTracker } from '../../structures/expire.js';
import { Lazy } from '../lazy.js';
import { LazyPromise } from '../promise.js';
import type { ILazyPromiseExtension } from '../types.js';

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

    test('refresh method', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async (refreshing) => {
            await setTimeoutAsync(10);
            counter++;
            return { value: counter, refreshing };
        });

        // Initial load
        await lazy.promise;
        expect(lazy.value?.value).toBe(1);
        expect(lazy.value?.refreshing).toBe(false);
        expect(counter).toBe(1);

        // Refresh
        const refreshResult = await lazy.refresh();
        expect(refreshResult.value).toBe(2);
        expect(refreshResult.refreshing).toBe(true);
        expect(lazy.value?.value).toBe(2);
        expect(counter).toBe(2);

        // Multiple concurrent refreshes - last one wins
        const refresh1 = lazy.refresh();
        const refresh2 = lazy.refresh();
        const refresh3 = lazy.refresh();

        await Promise.all([refresh1, refresh2, refresh3]);

        // Only the last refresh should update the instance
        expect(lazy.value?.value).toBe(5);
        expect(counter).toBe(5);
    });

    test('refresh with error handling', async () => {
        let shouldFail = false;
        let counter = 0;

        const lazy = new LazyPromise(async () => {
            await setTimeoutAsync(10);
            counter++;
            if (shouldFail) {
                throw new Error('Refresh failed');
            }
            return { value: counter };
        });

        // Initial successful load
        await lazy.promise;
        expect(lazy.value?.value).toBe(1);
        expect(lazy.error).toBeNull();

        // Refresh with error
        shouldFail = true;
        const result = await lazy.refresh();
        expect(result.value).toBe(1); // returns current instance on error
        expect(lazy.error).toBe('Refresh failed');
        expect(lazy.value?.value).toBe(1); // value unchanged

        // Refresh successfully after error
        shouldFail = false;
        await lazy.refresh();
        expect(lazy.value?.value).toBe(3);
        // Error should be cleared on successful refresh
        expect(lazy.error).toBeNull();
    });

    test('error handling', () => {
        {
            // Test with Error object
            const l = new Lazy(() => {
                throw new Error('Error object message');
            });

            expect(l.hasValue).toBeFalse();
            expect(l.error).toBeNull();
            expect(l.value).toBeUndefined();
            expect(l.hasValue).toBeFalse();
            expect(l.error).toBe('Error object message');
        }

        {
            // Test multiple accesses with error
            const l = new Lazy(() => {
                throw new Error('Factory error');
            });

            expect(l.value).toBeUndefined();
            expect(l.error).toBe('Factory error');
            expect(l.value).toBeUndefined();
            expect(l.error).toBe('Factory error');
        }

        {
            // Test error is cleared on reset
            const l = new Lazy(() => {
                throw new Error('error');
            });

            expect(l.value).toBeUndefined();
            expect(l.error).toBe('error');

            l.reset();
            expect(l.error).toBeNull();
        }
    });

    test('error handling with LazyPromise', async () => {
        {
            // Test with Error object
            const l = new LazyPromise(async () => {
                throw new Error('async error message');
            });

            expect(l.error).toBeNull();
            await l.promise;
            expect(l.error).toBe('async error message');
            expect(l.hasValue).toBeTrue();
            expect(l.value).toBeUndefined();
        }

        {
            // Test with another Error
            const l = new LazyPromise(async () => {
                throw new Error('async Error object');
            });

            await l.promise;
            expect(l.error).toBe('async Error object');
        }

        {
            // Test with initial value and error - returns to initial
            const l = new LazyPromise<string, string>(async () => {
                throw new Error('error occurred');
            }, 'initial value');

            expect(l.value).toBe('initial value');
            await l.promise;
            expect(l.error).toBe('error occurred');
            expect(l.value).toBe('initial value'); // falls back to initial
        }
    });

    describe('extend', () => {
        test('overrideFactory - adds logging', async () => {
            const logs: string[] = [];
            const base = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return 'result';
            });

            // Universal extension - works with any type
            const loggingExtension: ILazyPromiseExtension<any> = {
                overrideFactory: (original) => async (refreshing) => {
                    logs.push(`loading:${refreshing ?? 'undefined'}`);
                    const result = await original(refreshing);
                    logs.push(`loaded:${String(result)}`);
                    return result;
                },
            };

            const extended = base.extend(loggingExtension);

            // Original should not be affected
            expect(base).not.toBe(extended);

            await extended.promise;
            expect(extended.value).toBe('result');
            expect(logs).toEqual(['loading:false', 'loaded:result']);

            logs.length = 0;
            await extended.refresh();
            expect(logs).toEqual(['loading:true', 'loaded:result']);
        });

        test('overrideFactory - adds retry logic', async () => {
            let attempts = 0;
            const base = new LazyPromise<string>(async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Retry me');
                }
                return 'success';
            });

            // Universal retry extension
            const retryExtension: ILazyPromiseExtension<any> = {
                overrideFactory: (original) => async (refreshing) => {
                    let retries = 0;
                    while (retries < 3) {
                        try {
                            return await original(refreshing);
                        } catch (e) {
                            retries++;
                            if (retries >= 3) throw e;
                            await setTimeoutAsync(10);
                        }
                    }
                    throw new Error('Unreachable');
                },
            };

            const extended = base.extend(retryExtension);

            await extended.promise;
            expect(extended.value).toBe('success');
            expect(attempts).toBe(3);
        });

        test('extendShape - adds custom methods', async () => {
            const base = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return { value: 42 };
            });

            let loadCount = 0;
            const extended = base.extend<{ getLoadCount: () => number }>({
                extendShape: (instance) => {
                    return Object.assign(instance, {
                        getLoadCount: () => loadCount,
                    });
                },
                overrideFactory: (original) => async (refreshing) => {
                    loadCount++;
                    return await original(refreshing);
                },
            });

            expect(extended.getLoadCount()).toBe(0);
            await extended.promise;
            expect(extended.getLoadCount()).toBe(1);
            await extended.refresh();
            expect(extended.getLoadCount()).toBe(2);
        });

        test('extendShape - adds computed properties', async () => {
            const base = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return { name: 'John', age: 30 };
            });

            type UserWithInfo = { name: string; age: number };
            const extended = base.extend<{ getFullInfo: () => string | undefined }>({
                extendShape: (instance) => {
                    return Object.assign(instance, {
                        getFullInfo: () => {
                            const val = instance.currentValue as UserWithInfo | undefined;
                            return val ? `${val.name} (${val.age})` : undefined;
                        },
                    });
                },
            });

            expect(extended.getFullInfo()).toBeUndefined();
            await extended.promise;
            expect(extended.value).toEqual({ name: 'John', age: 30 });
            expect(extended.getFullInfo()).toBe('John (30)');
        });

        test('preserves expire tracker', async () => {
            let counter = 0;
            const expire = new ExpireTracker(10);

            const base = new LazyPromise(async () => {
                await setTimeoutAsync(5);
                return ++counter;
            }).withExpire(expire);

            const extended = base.extend({
                overrideFactory: (original) => original,
            });

            await extended.promise;
            expect(extended.value).toBe(1);
            expect(expire.isExpired).toBeFalse();

            await setTimeoutAsync(11);
            expect(expire.isExpired).toBeTrue();

            await extended.promise;
            expect(extended.value).toBe(2);
        });

        test('original instance remains unchanged', async () => {
            const base = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return 'original';
            });

            // Type-specific extension for strings
            const appendExtension: ILazyPromiseExtension<string> = {
                overrideFactory: (original) => async (refreshing) => {
                    const result = await original(refreshing);
                    return result + '-modified';
                },
            };

            const extended = base.extend(appendExtension);

            await extended.promise;
            expect(extended.value).toBe('original-modified');

            await base.promise;
            expect(base.value).toBe('original');
        });

        test('chaining multiple extensions', async () => {
            const logs: string[] = [];
            const base = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return 10;
            });

            // Universal logging extension
            const loggingExtension: ILazyPromiseExtension<any> = {
                overrideFactory: (original) => async (refreshing) => {
                    logs.push('log:start');
                    const result = await original(refreshing);
                    logs.push('log:end');
                    return result;
                },
            };

            const withLogging = base.extend(loggingExtension);

            // Type-specific extension for numbers only
            const doublingExtension: ILazyPromiseExtension<number> = {
                overrideFactory: (original) => async (refreshing) => {
                    const result = await original(refreshing);
                    return result * 2;
                },
            };

            const withDoubling = withLogging.extend(doublingExtension);

            const withStats = withDoubling.extend<{ getLogCount: () => number }>({
                extendShape: (instance) => {
                    return Object.assign(instance, {
                        getLogCount: () => logs.length,
                    });
                },
            });

            await withStats.promise;
            expect(withStats.value).toBe(20);
            expect(logs).toEqual(['log:start', 'log:end']);
            expect(withStats.getLogCount()).toBe(2);
        });

        test('extension with initial value', async () => {
            const base = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return 100;
            }, 50);

            // Type-specific extension for numbers
            const doublingExtension: ILazyPromiseExtension<number> = {
                overrideFactory: (original) => async (refreshing) => {
                    const result = await original(refreshing);
                    return result * 2;
                },
            };

            const extended = base.extend(doublingExtension);

            expect(extended.value).toBe(50);
            expect(extended.isLoading).toBeTrue();

            await extended.promise;
            expect(extended.value).toBe(200);
        });

        test('type safety - number extension only works with numbers', async () => {
            const numberLazy = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return 42;
            });

            const stringLazy = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return 'hello';
            });

            // Type-specific extension for numbers
            const doublingExtension: ILazyPromiseExtension<number> = {
                overrideFactory: (original) => async (refreshing) => {
                    const result = await original(refreshing);
                    return result * 2;
                },
            };

            // This should work fine
            const doubled = numberLazy.extend(doublingExtension);
            await doubled.promise;
            expect(doubled.value).toBe(84);

            // This should cause a TypeScript error - demonstrating type safety
            // TypeScript will prevent this at compile time:
            // @ts-expect-error - Cannot apply number extension to string LazyPromise
            const _invalid = stringLazy.extend(doublingExtension);
            // If we were to run it, it would produce NaN (string * 2 = NaN)
        });

        test('universal extension works with any type', async () => {
            // Universal extension that works with any type
            const loggingExtension: ILazyPromiseExtension<any> = {
                overrideFactory: (original) => async (refreshing) => {
                    const result = await original(refreshing);
                    return result; // just pass through
                },
            };

            const numberLazy = new LazyPromise(async () => 42);
            const stringLazy = new LazyPromise(async () => 'hello');
            const objectLazy = new LazyPromise(async () => ({ id: 1 }));

            // All should work
            const extNum = numberLazy.extend(loggingExtension);
            const extStr = stringLazy.extend(loggingExtension);
            const extObj = objectLazy.extend(loggingExtension);

            await Promise.all([extNum.promise, extStr.promise, extObj.promise]);

            expect(extNum.value).toBe(42);
            expect(extStr.value).toBe('hello');
            expect(extObj.value).toEqual({ id: 1 });
        });
    });

});
