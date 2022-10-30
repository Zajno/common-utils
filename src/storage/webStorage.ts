
import { IStorageSync } from '@zajno/common/lib/storage';

export abstract class WebStorage implements IStorageSync {

    protected abstract get storage(): Storage;

    getValue(key: string) {
        return this.storage.getItem(key);
    }

    setValue(key: string, value: string) {
        this.storage.setItem(key, value);
    }

    hasValue(key: string) {
        return this.storage.getItem(key) != null;
    }

    removeValue(key: string) {
        const hasValue = this.hasValue(key);
        if (!hasValue) {
            return false;
        }

        this.storage.removeItem(key);
        return true;
    }
}
