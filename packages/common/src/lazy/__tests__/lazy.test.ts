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
        expect(l.currentValue).toBeUndefined();

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
        const factory = vi.fn(() => setTimeoutAsync(10).then(() => VAL));
        const l = new LazyPromise(factory);

        expect(l.hasValue).toBeFalse();
        expect(l.isLoading).toBeNull();

        expect(l.value).toBeUndefined();
        expect(l.isLoading).toBeTrue();

        const p = l.promise;

        const VAL2 = 'abc2';
        l.setInstance(VAL2);

        await expect(p).resolves.toBe(VAL2);
        await expect(l.promise).resolves.toBe(VAL2);

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
        expect(l.value).toBe(1);

        await expect(l.promise).resolves.toBe(2);
        expect(incrementor).toBe(2);
        expect(expire.isExpired).toBeFalse();

        expire.expire();
        expect(expire.isExpired).toBeTrue();
        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(2);
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
        const factory = vi.fn(async (refreshing) => {
            await setTimeoutAsync(10);
            counter++;
            return { value: counter, refreshing };
        });

        const lazy = new LazyPromise(factory);

        await lazy.promise;
        expect(lazy.value?.value).toBe(1);
        expect(lazy.value?.refreshing).toBe(false);
        expect(counter).toBe(1);

        expect(factory).toHaveBeenCalledExactlyOnceWith(false);
        factory.mockClear();

        const refreshResult = await lazy.refresh();
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

        await Promise.all([refresh1, refresh2, refresh3]);

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

        await lazy.promise;
        expect(lazy.value?.value).toBe(1);
        expect(lazy.error).toBeNull();

        shouldFail = true;
        const result = await lazy.refresh();
        expect(counter).toBe(2);
        expect(result.value).toBe(1);
        expect(lazy.error).toBe('Refresh failed');
        expect(lazy.value?.value).toBe(1);

        shouldFail = false;
        await lazy.refresh();
        expect(lazy.value?.value).toBe(3);
        expect(lazy.error).toBeNull();
    });

    test('refresh during initial load - refresh wins', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await setTimeoutAsync(50);
            return counter;
        });

        const initialPromise = lazy.promise;
        expect(lazy.isLoading).toBe(true);

        await setTimeoutAsync(10);
        const refreshPromise = lazy.refresh();

        const [initialResult, refreshResult] = await Promise.all([initialPromise, refreshPromise]);

        expect(initialResult).toBe(2);
        expect(refreshResult).toBe(2);
        expect(lazy.value).toBe(2);
        expect(counter).toBe(2);
    });

    test('multiple concurrent refreshes - latest wins', async () => {
        const delays = [100, 50, 20];
        let callIndex = 0;

        const lazy = new LazyPromise(async () => {
            const myIndex = callIndex++;
            const myDelay = delays[myIndex - 1] || 10;
            await setTimeoutAsync(myDelay);
            return myIndex + 1;
        });

        {
            await lazy.promise;
            expect(lazy.value).toBe(1);

            const refresh1 = lazy.refresh();
            await setTimeoutAsync(5);
            const refresh2 = lazy.refresh();
            await setTimeoutAsync(5);
            const refresh3 = lazy.refresh();

            const [r1, r2, r3] = await Promise.all([refresh1, refresh2, refresh3]);

            expect(lazy.value).toBe(4);
            expect(r3).toBe(4);
            expect(r1).toBe(4);
            expect(r2).toBe(4);
        }

        lazy.reset();
        callIndex = 0;
        delays.length = 0;
        delays.push(20, 50, 100);

        {
            await lazy.promise;
            expect(lazy.value).toBe(1);

            const refresh1 = lazy.refresh();
            await setTimeoutAsync(5);
            const refresh2 = lazy.refresh();
            await setTimeoutAsync(5);
            const refresh3 = lazy.refresh();

            const [r1, r2, r3] = await Promise.all([refresh1, refresh2, refresh3]);

            expect(lazy.value).toBe(4);
            expect(r3).toBe(4);
            expect(r1).toBe(4);
            expect(r2).toBe(4);
        }

    });

    test('await lazy.promise during refresh gets refreshed value', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await setTimeoutAsync(30);
            return counter;
        });

        await lazy.promise;
        expect(lazy.value).toBe(1);

        const refreshPromise = lazy.refresh();

        await setTimeoutAsync(5);
        const promiseResult = await lazy.promise;

        expect(promiseResult).toBe(2);
        expect(await refreshPromise).toBe(2);
        expect(lazy.value).toBe(2);
    });

    test('initial load during refresh joins the refresh', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await setTimeoutAsync(30);
            return counter;
        });

        expect(lazy.isLoading).toBeNull();
        const refreshPromise = lazy.refresh();

        await setTimeoutAsync(5);
        const promiseResult = await lazy.promise;

        expect(promiseResult).toBe(1);
        expect(await refreshPromise).toBe(1);
        expect(counter).toBe(1);
    });

    test('concurrent load and refresh - refresh supersedes', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await setTimeoutAsync(50);
            return counter;
        });

        const loadPromise = lazy.promise;
        expect(lazy.isLoading).toBe(true);

        await setTimeoutAsync(5);
        const refreshPromise = lazy.refresh();

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
            await setTimeoutAsync(30);
            return counter;
        });

        const promiseRef1 = lazy.promise;
        expect(lazy.isLoading).toBe(true);

        await setTimeoutAsync(10);
        lazy.refresh();

        const result = await promiseRef1;
        expect(result).toBe(2);

        expect(lazy.value).toBe(2);
    });

    test('multiple refreshes - all old promise refs get latest value', async () => {
        let counter = 0;
        const lazy = new LazyPromise(async () => {
            counter++;
            await setTimeoutAsync(20);
            return counter;
        });

        const promiseRef1 = lazy.promise;

        await setTimeoutAsync(5);
        lazy.refresh();
        const promiseRef2 = lazy.promise;

        await setTimeoutAsync(5);
        lazy.refresh();
        const promiseRef3 = lazy.promise;

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

    test('error handling', () => {
        {
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
            const l = new Lazy(() => {
                throw new Error('Factory error');
            });

            expect(l.value).toBeUndefined();
            expect(l.error).toBe('Factory error');
            expect(l.value).toBeUndefined();
            expect(l.error).toBe('Factory error');
        }

        {
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
            const l = new LazyPromise(async () => {
                throw new Error('async Error object');
            });

            await l.promise;
            expect(l.error).toBe('async Error object');
        }

        {
            const l = new LazyPromise<string, string>(async () => {
                throw new Error('error occurred');
            }, 'initial value');

            expect(l.value).toBe('initial value');
            await l.promise;
            expect(l.error).toBe('error occurred');
            expect(l.value).toBe('initial value');
        }
    });

    describe('extend', () => {
        test('overrideFactory - adds logging', async () => {
            const logs: string[] = [];
            const base = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return 'result';
            });

            const loggingExtension: ILazyPromiseExtension<any> & { customData: string } = {
                overrideFactory: (original) => async (refreshing) => {
                    logs.push(`loading:${refreshing ?? 'undefined'}`);
                    const result = await original(refreshing);
                    logs.push(`loaded:${String(result)}`);
                    return result;
                },
                customData: 'customValue',
            };

            const extended = base.extend(loggingExtension);

            expect(base).toBe(extended);

            expect(extended.currentValue).toBeUndefined();
            expect(extended.isLoading).toBeNull();

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

        test('extend() mutates the original instance', async () => {
            const base = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return 'original';
            });

            const appendExtension: ILazyPromiseExtension<string> = {
                overrideFactory: (original) => async (refreshing) => {
                    const result = await original(refreshing);
                    return result + '-modified';
                },
            };

            const extended = base.extend(appendExtension);

            expect(base).toBe(extended);

            await extended.promise;
            expect(extended.value).toBe('original-modified');

            expect(base.value).toBe('original-modified');
        });

        test('chaining multiple extensions', async () => {
            const logs: string[] = [];
            const base = new LazyPromise(async () => {
                await setTimeoutAsync(10);
                return 10;
            });

            const loggingExtension: ILazyPromiseExtension<any> = {
                overrideFactory: (original) => async (refreshing) => {
                    logs.push('log:start');
                    const result = await original(refreshing);
                    logs.push('log:end');
                    return result;
                },
            };

            const withLogging = base.extend(loggingExtension);

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

            const doublingExtension: ILazyPromiseExtension<number> = {
                overrideFactory: (original) => async (refreshing) => {
                    const result = await original(refreshing);
                    return result * 2;
                },
            };

            const doubled = numberLazy.extend(doublingExtension);
            await doubled.promise;
            expect(doubled.value).toBe(84);

            // @ts-expect-error - Cannot apply number extension to string LazyPromise
            const _invalid = stringLazy.extend(doublingExtension);
        });

        test('universal extension works with any type', async () => {
            const loggingExtension: ILazyPromiseExtension<any> = {
                overrideFactory: (original) => async (refreshing) => {
                    const result = await original(refreshing);
                    return result;
                },
            };

            const numberLazy = new LazyPromise(async () => 42);
            const stringLazy = new LazyPromise(async () => 'hello');
            const objectLazy = new LazyPromise(async () => ({ id: 1 }));

            const extNum = numberLazy.extend(loggingExtension);
            const extStr = stringLazy.extend(loggingExtension);
            const extObj = objectLazy.extend(loggingExtension);

            await Promise.all([extNum.promise, extStr.promise, extObj.promise]);

            expect(extNum.value).toBe(42);
            expect(extStr.value).toBe('hello');
            expect(extObj.value).toEqual({ id: 1 });
        });

        test('extension dispose is called on LazyPromise disposal', async () => {
            const disposeCalls: string[] = [];

            const disposableExtension: ILazyPromiseExtension<any> = {
                dispose: () => {
                    disposeCalls.push('extension-disposed');
                },
            };

            const base = new LazyPromise(async () => 'test');
            const extended = base.extend(disposableExtension);

            await extended.promise;
            expect(extended.value).toBe('test');
            expect(disposeCalls).toEqual([]);

            extended.dispose();
            expect(disposeCalls).toEqual(['extension-disposed']);
        });

        test('multiple extension disposers are called in reverse order', async () => {
            const disposeCalls: string[] = [];

            const extension1: ILazyPromiseExtension<any> = {
                dispose: () => {
                    disposeCalls.push('ext1-disposed');
                },
            };

            const extension2: ILazyPromiseExtension<any> = {
                dispose: () => {
                    disposeCalls.push('ext2-disposed');
                },
            };

            const extension3: ILazyPromiseExtension<any> = {
                dispose: () => {
                    disposeCalls.push('ext3-disposed');
                },
            };

            const base = new LazyPromise(async () => 'test');
            const extended = base
                .extend(extension1)
                .extend(extension2)
                .extend(extension3);

            await extended.promise;
            expect(disposeCalls).toEqual([]);

            extended.dispose();
            expect(disposeCalls).toEqual(['ext3-disposed', 'ext2-disposed', 'ext1-disposed']);
        });

        test('extension dispose receives the extended instance', async () => {
            let disposedInstance: any = null;

            const trackedExtension: ILazyPromiseExtension<string, { tracked: boolean }> = {
                extendShape: (instance) => {
                    return Object.assign(instance, {
                        tracked: true,
                    });
                },
                dispose: (instance) => {
                    disposedInstance = instance;
                },
            };

            const base = new LazyPromise(async () => 'test');
            const extended = base.extend(trackedExtension);

            await extended.promise;
            expect(extended.tracked).toBe(true);

            extended.dispose();
            expect(disposedInstance).toBe(extended);
            expect(disposedInstance.tracked).toBe(true);
        });

        test('extension dispose is called even if LazyPromise was never loaded', () => {
            const disposeCalls: string[] = [];

            const disposableExtension: ILazyPromiseExtension<any> = {
                dispose: () => {
                    disposeCalls.push('disposed');
                },
            };

            const base = new LazyPromise(async () => 'test');
            const extended = base.extend(disposableExtension);

            // Never access .value or .promise
            expect(extended.isLoading).toBeNull();

            extended.dispose();
            expect(disposeCalls).toEqual(['disposed']);
        });

        test('extension without dispose does not break disposal chain', async () => {
            const disposeCalls: string[] = [];

            const extension1: ILazyPromiseExtension<any> = {
                dispose: () => {
                    disposeCalls.push('ext1-disposed');
                },
            };

            // No dispose method
            const extension2: ILazyPromiseExtension<any> = {
                overrideFactory: (original) => original,
            };

            const extension3: ILazyPromiseExtension<any> = {
                dispose: () => {
                    disposeCalls.push('ext3-disposed');
                },
            };

            const base = new LazyPromise(async () => 'test');
            const extended = base
                .extend(extension1)
                .extend(extension2)
                .extend(extension3);

            await extended.promise;
            extended.dispose();

            expect(disposeCalls).toEqual(['ext3-disposed', 'ext1-disposed']);
        });

        test('extension dispose can clean up resources', async () => {
            let intervalId: NodeJS.Timeout | null = null;
            const ticks: number[] = [];

            const intervalExtension: ILazyPromiseExtension<any, { stopInterval: () => void }> = {
                extendShape: (instance) => {
                    return Object.assign(instance, {
                        stopInterval: () => {
                            if (intervalId !== null) {
                                clearInterval(intervalId);
                                intervalId = null;
                            }
                        },
                    });
                },
                overrideFactory: (original) => async (refreshing) => {
                    intervalId = setInterval(() => {
                        ticks.push(Date.now());
                    }, 10);
                    return await original(refreshing);
                },
                dispose: (instance) => {
                    instance.stopInterval();
                },
            };

            const base = new LazyPromise(async () => {
                await setTimeoutAsync(30);
                return 'done';
            });
            const extended = base.extend(intervalExtension);

            await extended.promise;
            expect(extended.value).toBe('done');

            await setTimeoutAsync(50);
            const tickCount = ticks.length;
            expect(tickCount).toBeGreaterThan(0);

            extended.dispose();
            await setTimeoutAsync(50);

            expect(ticks.length).toBe(tickCount);
        });
    });

});
