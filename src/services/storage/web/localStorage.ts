import { KeyStorage, KeyStorageConverted, StorageAsyncWrapper } from '..';
import IStorage, { IStorageSync } from '../../../abstractions/services/storage';
import { WebStorage } from './webStorage';

/* global window */

if (typeof window === 'undefined') {
    throw new Error("Can't use web/Storage module outside browser environment!");
}

class WebLocalStorage extends WebStorage {
    protected get storage() { return window.localStorage; }
}

export const LocalStorage: IStorageSync = new WebLocalStorage();

export const LocalStorageAsync: IStorage = new StorageAsyncWrapper(LocalStorage);

export class LocalKeyStorage extends KeyStorage {
    constructor(readonly key: string) {
        super(LocalStorage, key);
    }
}

export class LocalKeyStorageConverted<T> extends KeyStorageConverted<T> {
    constructor(
        key: string,
        input?: (v: T) => string,
        output?: (s: string) => T,
    ) {
        super(LocalStorage, key, input, output);
    }
}

export default LocalStorage;
