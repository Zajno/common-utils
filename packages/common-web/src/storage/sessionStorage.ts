import type { IStorage, IStorageSync } from '@zajno/common/storage';
import { Storages } from '@zajno/common/storage';
import { WebStorage } from './webStorage.js';

class WebSessionStorage extends WebStorage {
    protected get storage() {
        if (typeof window === 'undefined') {
            throw new Error("Can't use web/Storage module outside browser environment!");
        }

        return window.sessionStorage;
    }
}

export const SessionStorage: IStorageSync = new WebSessionStorage();

export const SessionStorageAsync: IStorage = Storages.toAsync(SessionStorage);
