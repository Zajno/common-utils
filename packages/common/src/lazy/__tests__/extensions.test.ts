import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LazyPromise } from '../promise.js';
import { createCacheExtension } from '../extensions.js';
import type { IKeyedStorage, IKeyedStorageSync } from '../../storage/types.js';

describe('createCacheExtension', () => {
    describe('with async storage', () => {
        const createStorage = () => {
            return {
                getValue: vi.fn(),
                setValue: vi.fn(),
                hasValue: vi.fn(),
                removeValue: vi.fn(),
            } satisfies IKeyedStorage<string>;
        };

        it('should return cached value on initial load if available', async () => {
            const mockStorage = createStorage();
            mockStorage.getValue.mockResolvedValue('cached-value');

            const factorySpy = vi.fn().mockResolvedValue('fresh-value');
            const lazy = new LazyPromise<string>(factorySpy);
            const cached = lazy.extend(createCacheExtension(mockStorage));

            const result = await cached.promise;

            expect(result).toBe('cached-value');
            expect(mockStorage.getValue).toHaveBeenCalledTimes(1);
            expect(factorySpy).not.toHaveBeenCalled();
            expect(mockStorage.setValue).not.toHaveBeenCalled();
        });

        it('should call factory and cache result if no cached value exists', async () => {
            const mockStorage = createStorage();
            mockStorage.getValue.mockResolvedValue(null);

            const factorySpy = vi.fn().mockResolvedValue('fresh-value');
            const lazy = new LazyPromise<string>(factorySpy);
            const cached = lazy.extend(createCacheExtension(mockStorage));

            const result = await cached.promise;

            expect(result).toBe('fresh-value');
            expect(mockStorage.getValue).toHaveBeenCalledTimes(1);
            expect(factorySpy).toHaveBeenCalledWith(false);
            expect(mockStorage.setValue).toHaveBeenCalledWith('fresh-value');
        });

        it('should bypass cache on refresh and update cached value', async () => {
            const mockStorage = createStorage();
            mockStorage.getValue.mockResolvedValue('old-cached-value');

            const factorySpy = vi.fn().mockResolvedValue('refreshed-value');
            const lazy = new LazyPromise<string>(factorySpy);
            const cached = lazy.extend(createCacheExtension(mockStorage));

            // Initial load uses cache
            await cached.promise;
            expect(mockStorage.getValue).toHaveBeenCalledTimes(1);

            // Reset spies
            mockStorage.getValue.mockClear();
            mockStorage.setValue.mockClear();

            // Refresh should bypass cache
            const refreshed = await cached.refresh();

            expect(refreshed).toBe('refreshed-value');
            expect(factorySpy).toHaveBeenCalledWith(true);
            expect(mockStorage.getValue).not.toHaveBeenCalled();
            expect(mockStorage.setValue).toHaveBeenCalledWith('refreshed-value');
        });

        it('should expose cache storage via cache property', async () => {
            const mockStorage = createStorage();
            const lazy = new LazyPromise<string>(async () => 'value');
            const cached = lazy.extend(createCacheExtension(mockStorage));

            expect(cached.cache).toBe(mockStorage);
        });

        it('should reset and clear cache with resetWithCache', async () => {
            const mockStorage = createStorage();
            mockStorage.getValue.mockResolvedValue(null);
            const factorySpy = vi.fn().mockResolvedValue('value');
            const lazy = new LazyPromise<string>(factorySpy);
            const cached = lazy.extend(createCacheExtension(mockStorage));

            // Load value
            await cached.promise;
            expect(cached.hasValue).toBe(true);
            expect(mockStorage.setValue).toHaveBeenCalledWith('value');

            // Reset with cache
            cached.resetWithCache();

            expect(mockStorage.removeValue).toHaveBeenCalledTimes(1);
            expect(cached.hasValue).toBe(false);
            expect(cached.isLoading).toBeNull();
        });

        it('should set value and update cache with setCachedInstance', async () => {
            const mockStorage = createStorage();
            const lazy = new LazyPromise<string>(async () => 'original');
            const cached = lazy.extend(createCacheExtension(mockStorage));

            const result = cached.setCachedInstance('manual-value');

            expect(result).toBe('manual-value');
            expect(cached.currentValue).toBe('manual-value');
            expect(cached.hasValue).toBe(true);
            expect(mockStorage.setValue).toHaveBeenCalledWith('manual-value');
        });

        it('should remove from cache when setCachedInstance is called with null', async () => {
            const mockStorage = createStorage();
            const lazy = new LazyPromise<string>(async () => 'value');
            const cached = lazy.extend(createCacheExtension(mockStorage));

            cached.setCachedInstance(null as any);

            expect(mockStorage.removeValue).toHaveBeenCalledTimes(1);
            expect(mockStorage.setValue).not.toHaveBeenCalled();
        });

        it('should remove from cache when setCachedInstance is called with undefined', async () => {
            const mockStorage = createStorage();
            const lazy = new LazyPromise<string>(async () => 'value');
            const cached = lazy.extend(createCacheExtension(mockStorage));

            cached.setCachedInstance(undefined as any);

            expect(mockStorage.removeValue).toHaveBeenCalledTimes(1);
            expect(mockStorage.setValue).not.toHaveBeenCalled();
        });

        it('should handle complex types', async () => {
            interface User {
                id: number;
                name: string;
            }

            const userStorage: IKeyedStorage<User> = {
                getValue: vi.fn().mockResolvedValue({ id: 1, name: 'Cached User' }),
                setValue: vi.fn(),
                hasValue: vi.fn(),
                removeValue: vi.fn(),
            };

            const fetchUser = vi.fn().mockResolvedValue({ id: 2, name: 'Fresh User' });
            const lazy = new LazyPromise<User>(fetchUser);
            const cached = lazy.extend(createCacheExtension(userStorage));

            const result = await cached.promise;

            expect(result).toEqual({ id: 1, name: 'Cached User' });
            expect(fetchUser).not.toHaveBeenCalled();
        });
    });

    describe('with sync storage', () => {
        let mockStorage: IKeyedStorageSync<number>;
        let getValueSpy: ReturnType<typeof vi.fn>;
        let setValueSpy: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            getValueSpy = vi.fn();
            setValueSpy = vi.fn();

            mockStorage = {
                getValue: getValueSpy,
                setValue: setValueSpy,
                hasValue: vi.fn(),
                removeValue: vi.fn(),
            };
        });

        it('should work with synchronous storage', async () => {
            getValueSpy.mockReturnValue(42);

            const factorySpy = vi.fn().mockResolvedValue(100);
            const lazy = new LazyPromise<number>(factorySpy);
            const cached = lazy.extend(createCacheExtension(mockStorage));

            const result = await cached.promise;

            expect(result).toBe(42);
            expect(factorySpy).not.toHaveBeenCalled();
        });

        it('should cache synchronously on setValue', async () => {
            getValueSpy.mockReturnValue(null);

            const factorySpy = vi.fn().mockResolvedValue(200);
            const lazy = new LazyPromise<number>(factorySpy);
            const cached = lazy.extend(createCacheExtension(mockStorage));

            await cached.promise;

            expect(setValueSpy).toHaveBeenCalledWith(200);
        });
    });

    describe('cache behavior with initial values', () => {
        it('should prefer cached value over initial value', async () => {
            const storage: IKeyedStorage<string> = {
                getValue: vi.fn().mockResolvedValue('cached'),
                setValue: vi.fn(),
                hasValue: vi.fn(),
                removeValue: vi.fn(),
            };

            const lazy = new LazyPromise<string, 'initial'>(async () => 'fresh', 'initial');
            const cached = lazy.extend(createCacheExtension(storage));

            expect(cached.currentValue).toBe('initial');

            const result = await cached.promise;
            expect(result).toBe('cached');
        });
    });

    describe('error handling', () => {
        it('should not cache failed requests', async () => {
            const storage: IKeyedStorage<string> = {
                getValue: vi.fn().mockResolvedValue(null),
                setValue: vi.fn(),
                hasValue: vi.fn(),
                removeValue: vi.fn(),
            };

            const factorySpy = vi.fn().mockRejectedValue(new Error('Network error'));
            const lazy = new LazyPromise<string>(factorySpy);
            const cached = lazy.extend(createCacheExtension(storage));

            await cached.promise; // Will reject but LazyPromise catches it

            expect(storage.setValue).not.toHaveBeenCalled();
            expect(cached.error).toBe('Network error');
        });
    });

    describe('chaining with other extensions', () => {
        it('should work with logging extension', async () => {
            const logs: string[] = [];
            const storage: IKeyedStorage<string> = {
                getValue: vi.fn().mockResolvedValue(null),
                setValue: vi.fn(),
                hasValue: vi.fn(),
                removeValue: vi.fn(),
            };

            const lazy = new LazyPromise<string>(async () => 'result');

            // First add cache, then logging
            const cached = lazy.extend(createCacheExtension(storage));
            const withLogging = cached.extend({
                overrideFactory: (factory) => async (refreshing) => {
                    logs.push(`loading (refreshing=${refreshing})`);
                    const result = await factory(refreshing);
                    logs.push(`loaded: ${result}`);
                    return result;
                },
            });

            await withLogging.promise;

            expect(logs).toEqual(['loading (refreshing=false)', 'loaded: result']);
            expect(storage.setValue).toHaveBeenCalledWith('result');
        });

        it('should accumulate extensions when chaining (mutating behavior)', async () => {
            const storage: IKeyedStorage<number> = {
                getValue: vi.fn().mockResolvedValue(null),
                setValue: vi.fn(),
                hasValue: vi.fn(),
                removeValue: vi.fn(),
            };

            const lazy = new LazyPromise<number>(async () => 10);

            // Chain multiple extensions
            const extended = lazy
                .extend(createCacheExtension(storage))
                .extend<{ double: () => number | undefined }>({
                    extendShape: (instance) => Object.assign(instance, {
                        double: () => {
                            const val = instance.currentValue;
                            return val !== undefined ? val * 2 : undefined;
                        },
                    }),
                });

            await extended.promise;

            // ALL extensions should be present on the same instance
            expect(extended.cache).toBe(storage);
            expect(typeof extended.resetWithCache).toBe('function');
            expect(typeof extended.setCachedInstance).toBe('function');
            expect(typeof extended.double).toBe('function');
            expect(extended.double()).toBe(20);

            // All methods should work
            extended.setCachedInstance(30);
            expect(extended.double()).toBe(60);
            expect(storage.setValue).toHaveBeenCalledWith(30);

            // Verify they're all on the same instance
            expect(extended).toBe(lazy); // Same instance!
        });

        it('should work correctly with dispose', async () => {
            const storage: IKeyedStorage<string> = {
                getValue: vi.fn().mockResolvedValue(null),
                setValue: vi.fn(),
                hasValue: vi.fn(),
                removeValue: vi.fn(),
            };

            const factorySpy = vi.fn().mockResolvedValue('value');
            const lazy = new LazyPromise<string>(factorySpy);
            const cached = lazy.extend(createCacheExtension(storage));

            await cached.promise;
            expect(cached.value).toBe('value');
            expect(storage.setValue).toHaveBeenCalledWith('value');

            // Dispose should not throw and should reset the instance
            cached.dispose();

            expect(cached.currentValue).toBeUndefined();
            expect(cached.hasValue).toBeFalse();
            expect(cached.isLoading).toBeNull();
        });

        it('should allow chaining with extensions that have dispose', async () => {
            const storage: IKeyedStorage<string> = {
                getValue: vi.fn().mockResolvedValue(null),
                setValue: vi.fn(),
                hasValue: vi.fn(),
                removeValue: vi.fn(),
            };

            const disposeCalls: string[] = [];

            const lazy = new LazyPromise<string>(async () => 'value');
            const extended = lazy
                .extend(createCacheExtension(storage))
                .extend({
                    dispose: () => {
                        disposeCalls.push('custom-disposed');
                    },
                });

            await extended.promise;
            expect(extended.value).toBe('value');

            extended.dispose();

            // Custom disposer should be called
            expect(disposeCalls).toEqual(['custom-disposed']);
            // Instance should be reset
            expect(extended.hasValue).toBeFalse();
        });
    });
});

