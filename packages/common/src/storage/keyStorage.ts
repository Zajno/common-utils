import { IStorageSync } from './abstractions';

export class KeyStorage {
    constructor(readonly storage: IStorageSync, readonly key: string) { }

    get value() { return this.storage.getValue(this.key); }
    set value(v: string) { this.storage.setValue(this.key, v); }

    public clean() {
        this.storage.removeValue(this.key);
    }

    public getHasValue() {
        return this.storage.hasValue(this.key);
    }
}

export class KeyStorageConverted<T> {
    private readonly _storage: KeyStorage;

    constructor(
        storage: IStorageSync,
        key: string,
        readonly input: (v: T) => string = (v => JSON.stringify(v)),
        readonly output: (s: string) => T = (s => JSON.parse(s || 'null') as T),
    ) {
        this._storage = new KeyStorage(storage, key);
    }

    get value(): T { return this.output(this._storage.value); }
    set value(v: T) { this._storage.value = this.input(v); }

    public clean() {
        this._storage.clean();
    }

    public getHasValue() {
        return this._storage.getHasValue();
    }
}
