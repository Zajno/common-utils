import IStorage, { IStorageSync } from '../abstractions/services/storage';

/* global window */

if (typeof window === undefined) {
    throw new Error("Can't use web/Storage module outside browser environment!");
}

export const LocalStorage: IStorageSync = {
    getValue(key: string) {
        return window.localStorage.getItem(key);
    },

    setValue(key: string, value: string) {
        window.localStorage.setItem(key, value);
    },

    hasValue(key: string) {
        return window.localStorage.getItem(key) != null;
    },

    removeValue(key: string) {
        const hasValue = LocalStorage.hasValue(key);
        if (!hasValue) {
            return false;
        }

        window.localStorage.removeItem(key);
        return true;
    },
};

export const LocalStorageAsync: IStorage = {
    getValue(key: string) {
        return Promise.resolve(LocalStorage.getValue(key));
    },

    setValue(key: string, value: string) {
        LocalStorage.setValue(key, value);
        return Promise.resolve();
    },

    hasValue(key: string) {
        return Promise.resolve(LocalStorage.hasValue(key));
    },

    remove(key: string) {
        LocalStorage.removeValue(key);
        return Promise.resolve();
    },
};

export class LocalKeyStorage {
    constructor(readonly key: string) { }

    get value() { return LocalStorage.getValue(this.key); }
    set value(v: string) { LocalStorage.setValue(this.key, v); }
}

export class LocalKeyStorageConverted<T> {
    private readonly _storage: LocalKeyStorage;

    constructor(
        key: string,
        readonly input: (v: T) => string,
        readonly output: (s: string) => T,
    ) {
        this._storage = new LocalKeyStorage(key);
    }

    get value(): T { return this.output(this._storage.value); }
    set value(v: T) { this._storage.value = this.input(v); }
}

export default LocalStorage;
