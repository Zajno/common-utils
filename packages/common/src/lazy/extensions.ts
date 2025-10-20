import type { IKeyedStorage, IKeyedStorageSync } from '../storage/types.js';
import { extendObject } from '../structures/extendObject.js';
import type { IControllableLazyPromise, ILazyPromiseExtension } from './types.js';

export interface ICachedLazyPromiseExtension<T, TStorage extends IKeyedStorage<T> | IKeyedStorageSync<T>> {
    readonly cache: TStorage;

    /** Resets the current value to undefined and cleans up the cache. */
    resetWithCache(): void;

    /** Sets the current value and updates the cache. */
    setCachedInstance(value: T | undefined): T | undefined;
}

export function createCacheExtension<T, TStorage extends IKeyedStorage<T> | IKeyedStorageSync<T>>(storage: TStorage): ILazyPromiseExtension<T, ICachedLazyPromiseExtension<T, TStorage>> {
    return {
        overrideFactory: (
            original: (refreshing?: boolean) => Promise<T>,
        ): ((refreshing?: boolean) => Promise<T>) => {
            return async (refreshing?: boolean): Promise<T> => {
                if (!refreshing) {
                    // read cached value first
                    const cached = await storage.getValue();
                    if (cached != null) {
                        return cached;
                    }
                }

                const value = await original(refreshing);

                // cache the fresh result
                storage.setValue(value);

                return value;
            };
        },
        extendShape: <TInitial extends T | undefined = undefined>(
            previous: IControllableLazyPromise<T, TInitial>,
        ) => {
            return extendObject<IControllableLazyPromise<T, TInitial>, ICachedLazyPromiseExtension<T, TStorage>>(
                previous,
                {
                    cache: {
                        get: () => storage,
                    },
                    resetWithCache: {
                        value: () => {
                            storage.removeValue();
                            previous.reset();
                        },
                    },
                    setCachedInstance: {
                        value: (value: T) => {
                            if (value == null) {
                                storage.removeValue();
                            } else {
                                storage.setValue(value);
                            }

                            return previous.setInstance(value);
                        },
                    },
                },
            );
        },
    };
}
