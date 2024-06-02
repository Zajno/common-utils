import { IKeyedStorage, IKeyedStorageSync, IStorage, IStorageSync } from './types';

export namespace Storages {

    const InstanceKeys = ['getValue', 'hasValue', 'setValue', 'removeValue'] as const satisfies (keyof IStorageSync)[];

    export function toAsync<T = string>(storage: IStorageSync<T>): IStorage<T> {
        const result = {} as IStorage<T>;
        InstanceKeys.forEach(key => {
            const original = storage[key]?.bind(storage) as (...args: unknown[]) => unknown;
            if (original) {
                result[key] = ((...args: unknown[]) => Promise.resolve(original(...args))) as any;
            }
        });
        return result;
    }

    export function toKeyed<T = string>(storage: IStorage<T>, storageKey: string): IKeyedStorage<T>;
    export function toKeyed<T = string>(storage: IStorageSync<T>, storageKey: string): IKeyedStorageSync<T>;

    export function toKeyed(storage: IStorage | IStorageSync, storageKey: string): IKeyedStorage | IKeyedStorageSync {
        const result = {} as IKeyedStorage | IKeyedStorageSync;
        InstanceKeys.forEach(key => {
            const original = storage[key]?.bind(storage) as (...args: unknown[]) => unknown;
            if (original) {
                result[key] = ((...args: unknown[]) => original(storageKey, ...args)) as any;
            }
        });
        return result;
    }

    export function toConverted<T, C = string>(storage: IStorage<C>, convertOutput: (s: C | null) => T, convertInput: (v: T) => C): IStorage<T>;
    export function toConverted<T, C = string>(storage: IStorageSync<C>, convertOutput: (s: C | null) => T, convertInput: (v: T) => C): IStorageSync<T>;

    export function toConverted<T>(storage: IStorage | IStorageSync, convertOutput: (s: string | null) => T, convertInput: (v: T) => string): IStorage<T> | IStorageSync<T> {
        const getValue = (key => {
            const res = storage.getValue(key);
            if (res instanceof Promise) {
                return res.then(r => convertOutput(r));
            }
            return convertOutput(res);
        }) as (IStorage<T> | IStorageSync<T>)['getValue'];

        const hasValue = (key => storage.hasValue(key)) as (IStorage<T> | IStorageSync<T>)['hasValue'];
        const removeValue = (key => storage.removeValue(key)) as (IStorage<T> | IStorageSync<T>)['removeValue'];

        return {
            getValue,
            setValue: (key, value) => {
                return storage.setValue(key, convertInput(value));
            },
            hasValue,
            removeValue,
        } as IStorage<T> | IStorageSync<T>;
    }

    export function toJSONConverted<T>(storage: IStorage<string>): IStorage<T>;
    export function toJSONConverted<T>(storage: IStorageSync<string>): IStorageSync<T>;

    export function toJSONConverted<T>(storage: IStorage<string> | IStorageSync<string>): IStorage<T> | IStorageSync<T> {
        return toConverted<T, string>(
            storage as any,
            s => JSON.parse(s || 'null'),
            v => JSON.stringify(v),
        );
    }
}
