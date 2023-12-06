import { IStorage, IStorageSync } from './abstractions';

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
