import IStorage, { IStorageSync } from '../../abstractions/services/storage';

export class StorageAsyncWrapper implements IStorage {

    constructor(readonly webStorage: IStorageSync) { }

    getValue(key: string) {
        return Promise.resolve(this.webStorage.getValue(key));
    }

    setValue(key: string, value: string) {
        this.webStorage.setValue(key, value);
        return Promise.resolve();
    }

    hasValue(key: string) {
        return Promise.resolve(this.webStorage.hasValue(key));
    }

    remove(key: string) {
        this.webStorage.removeValue(key);
        return Promise.resolve();
    }
}

export class KeyStorage {
    constructor(readonly storage: IStorageSync, readonly key: string) { }

    get value() { return this.storage.getValue(this.key); }
    set value(v: string) { this.storage.setValue(this.key, v); }
}

export class KeyStorageConverted<T> {
    private readonly _storage: KeyStorage;

    constructor(
        storage: IStorageSync,
        key: string,
        readonly input: (v: T) => string = (v => JSON.stringify(v)),
        readonly output: (s: string) => T = (s => JSON.parse(s) as T),
    ) {
        this._storage = new KeyStorage(storage, key);
    }

    get value(): T { return this.output(this._storage.value); }
    set value(v: T) { this._storage.value = this.input(v); }
}
