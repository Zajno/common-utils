import { KeyStorage, KeyStorageConverted } from '@zajno/common/storage/keyStorage';
import { StorageAsyncWrapper } from '@zajno/common/storage/asyncWrapper';
import { IStorage, IStorageSync } from '@zajno/common/storage/abstractions';
import { WebStorage } from './webStorage';

/* global window */

if (typeof window === 'undefined') {
    throw new Error("Can't use web/Storage module outside browser environment!");
}

class WebSessionStorage extends WebStorage {
    protected get storage() { return window.sessionStorage; }
}

export const SessionStorage: IStorageSync = new WebSessionStorage();

export const SessionStorageAsync: IStorage = new StorageAsyncWrapper(SessionStorage);

export class SessionKeyStorage extends KeyStorage {
    constructor(readonly key: string) {
        super(SessionStorage, key);
    }
}

export class SessionKeyStorageConverted<T> extends KeyStorageConverted<T> {
    constructor(
        key: string,
        input?: (v: T) => string,
        output?: (s: string) => T,
    ) {
        super(SessionStorage, key, input, output);
    }
}

export default SessionStorage;
