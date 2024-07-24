import type { IStorage, IStorageSync } from '@zajno/common/storage/types';
import { Storages } from '@zajno/common/storage/wrappers';
import { WebStorage } from './webStorage';

class WebLocalStorage extends WebStorage {
    protected get storage() {
        if (typeof window === 'undefined') {
            throw new Error("Can't use web/Storage module outside browser environment!");
        }

        return window.localStorage;
    }
}

export const LocalStorage: IStorageSync = new WebLocalStorage();

export const LocalStorageAsync: IStorage = Storages.toAsync(LocalStorage);
