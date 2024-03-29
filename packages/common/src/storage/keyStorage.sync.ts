import { IStorageSync } from './abstractions';

export class KeyStorageSync {
    constructor(readonly storage: IStorageSync, readonly key: string) { }

    get value(): string | null { return this.storage.getValue(this.key); }
    set value(v: string) { this.storage.setValue(this.key, v); }

    public clean() {
        this.storage.removeValue(this.key);
    }

    public getHasValue() {
        return this.storage.hasValue(this.key);
    }
}

export class KeyStorageSyncConverted<T> {
    private readonly _storage: KeyStorageSync;

    constructor(
        storage: IStorageSync,
        key: string,
        readonly input: (v: T) => string = (v => JSON.stringify(v)),
        readonly output: (s: string | null) => T = (s => JSON.parse(s || 'null') as T),
    ) {
        this._storage = new KeyStorageSync(storage, key);
    }

    get value(): T | null { return this.output(this._storage.value); }
    set value(v: T) { this._storage.value = this.input(v); }

    public clean() {
        this._storage.clean();
    }

    public getHasValue() {
        return this._storage.getHasValue();
    }
}
