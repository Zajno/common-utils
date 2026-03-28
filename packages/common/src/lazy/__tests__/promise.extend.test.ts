
import { ExpireTracker } from '../../structures/expire.js';
import { LazyPromise } from '../promise.js';
import type { ILazyPromiseExtension } from '../types.js';

/** Helper: creates a promise that resolves after `ms` milliseconds (works with fake timers). */
function delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}

describe('LazyPromise.extend', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('overrideFactory - adds logging', async () => {
        const logs: string[] = [];
        const base = new LazyPromise(async () => {
            await delay(10);
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

        const p = extended.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(extended.value).toBe('result');
        expect(logs).toEqual(['loading:false', 'loaded:result']);

        logs.length = 0;
        const rp = extended.refresh();
        await vi.advanceTimersByTimeAsync(10);
        await rp;
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
                        await delay(10);
                    }
                }
                throw new Error('Unreachable');
            },
        };

        const extended = base.extend(retryExtension);

        const p = extended.promise;
        await vi.advanceTimersByTimeAsync(20);
        await p;
        expect(extended.value).toBe('success');
        expect(attempts).toBe(3);
    });

    test('extendShape - adds custom methods', async () => {
        const base = new LazyPromise(async () => {
            await delay(10);
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
        const p = extended.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(extended.getLoadCount()).toBe(1);
        const rp = extended.refresh();
        await vi.advanceTimersByTimeAsync(10);
        await rp;
        expect(extended.getLoadCount()).toBe(2);
    });

    test('extendShape - adds computed properties', async () => {
        const base = new LazyPromise(async () => {
            await delay(10);
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
        const p = extended.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(extended.value).toEqual({ name: 'John', age: 30 });
        expect(extended.getFullInfo()).toBe('John (30)');
    });

    test('preserves expire tracker', async () => {
        let counter = 0;
        const expire = new ExpireTracker(10);

        const base = new LazyPromise(async () => {
            await delay(5);
            return ++counter;
        }).withExpire(expire);

        const extended = base.extend({
            overrideFactory: (original) => original,
        });

        const p = extended.promise;
        await vi.advanceTimersByTimeAsync(5);
        await p;
        expect(extended.value).toBe(1);
        expect(expire.isExpired).toBeFalse();

        await vi.advanceTimersByTimeAsync(11);
        expect(expire.isExpired).toBeTrue();

        const p2 = extended.promise;
        await vi.advanceTimersByTimeAsync(5);
        await p2;
        expect(extended.value).toBe(2);
    });

    test('extend() mutates the original instance', async () => {
        const base = new LazyPromise(async () => {
            await delay(10);
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

        const p = extended.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(extended.value).toBe('original-modified');

        expect(base.value).toBe('original-modified');
    });

    test('chaining multiple extensions', async () => {
        const logs: string[] = [];
        const base = new LazyPromise(async () => {
            await delay(10);
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

        const p = withStats.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(withStats.value).toBe(20);
        expect(logs).toEqual(['log:start', 'log:end']);
        expect(withStats.getLogCount()).toBe(2);
    });

    test('extension with initial value', async () => {
        const base = new LazyPromise(async () => {
            await delay(10);
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

        const p = extended.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
        expect(extended.value).toBe(200);
    });

    test('type safety - number extension only works with numbers', async () => {
        const numberLazy = new LazyPromise(async () => {
            await delay(10);
            return 42;
        });

        const stringLazy = new LazyPromise(async () => {
            await delay(10);
            return 'hello';
        });

        const doublingExtension: ILazyPromiseExtension<number> = {
            overrideFactory: (original) => async (refreshing) => {
                const result = await original(refreshing);
                return result * 2;
            },
        };

        const doubled = numberLazy.extend(doublingExtension);
        const p = doubled.promise;
        await vi.advanceTimersByTimeAsync(10);
        await p;
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
            dispose: () => { disposeCalls.push('ext1-disposed'); },
        };

        const extension2: ILazyPromiseExtension<any> = {
            dispose: () => { disposeCalls.push('ext2-disposed'); },
        };

        const extension3: ILazyPromiseExtension<any> = {
            dispose: () => { disposeCalls.push('ext3-disposed'); },
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
            dispose: () => { disposeCalls.push('disposed'); },
        };

        const base = new LazyPromise(async () => 'test');
        const extended = base.extend(disposableExtension);

        expect(extended.isLoading).toBeNull();

        extended.dispose();
        expect(disposeCalls).toEqual(['disposed']);
    });

    test('extension without dispose does not break disposal chain', async () => {
        const disposeCalls: string[] = [];

        const extension1: ILazyPromiseExtension<any> = {
            dispose: () => { disposeCalls.push('ext1-disposed'); },
        };

        const extension2: ILazyPromiseExtension<any> = {
            overrideFactory: (original) => original,
        };

        const extension3: ILazyPromiseExtension<any> = {
            dispose: () => { disposeCalls.push('ext3-disposed'); },
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
        let intervalId: ReturnType<typeof setInterval> | null = null;
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
            await delay(30);
            return 'done';
        });
        const extended = base.extend(intervalExtension);

        const p = extended.promise;
        await vi.advanceTimersByTimeAsync(30);
        await p;
        expect(extended.value).toBe('done');

        await vi.advanceTimersByTimeAsync(50);
        const tickCount = ticks.length;
        expect(tickCount).toBeGreaterThan(0);

        extended.dispose();
        await vi.advanceTimersByTimeAsync(50);

        expect(ticks.length).toBe(tickCount);
    });
});
