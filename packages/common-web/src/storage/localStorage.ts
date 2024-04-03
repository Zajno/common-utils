import { KeyStorage } from '@zajno/common/storage/keyStorage';
import { StorageAsyncWrapper } from '@zajno/common/storage/asyncWrapper';
import { IStorage, IStorageSync } from '@zajno/common/storage/abstractions';
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
    constructor(key: string) {
        super(LocalStorageAsync, key);
    }
}
