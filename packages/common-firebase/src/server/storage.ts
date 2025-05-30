import { createLazy } from '@zajno/common/lazy/light';
import Admin from './admin.js';
import type { storage as Storage } from 'firebase-admin';
import { LoggerProvider } from '@zajno/common/logger';

export type StorageType = Storage.Storage;
export type BucketType = ReturnType<StorageType['bucket']>;

const storage: StorageType = Admin.storage();
const StorageBucket = createLazy(() => {
    const bucketName = storage.bucket().name;
    const bucket: ReturnType<typeof storage.bucket> = storage.bucket(bucketName);
    return bucket;
});

export const Logging = new LoggerProvider();

export const StorageContext = {
    get storage(): StorageType { return storage; },
    get bucket(): BucketType { return StorageBucket.value; },
};

export async function removeDirectoryFromStorage(path: string): Promise<void> {
    if (!path) {
        throw Error('Invalid path');
    }

    Logging.logger?.log(`Start deleting files :::: ${path}`);
    try {
        await StorageContext.bucket.deleteFiles({ prefix: path });
        Logging.logger?.log(`Files successfully deleted :::: ${path}`);
    } catch (error) {
        Logging.logger?.error(`Error while deleting files :::: ${path} ::::`, error);
    }
}

export async function deleteFile(fileRef: string) {
    const file = StorageContext.bucket.file(fileRef);
    try {
        Logging.logger?.log('Deleting file by ref:', fileRef);
        await file.delete();
        return true;
    } catch (err) {
        Logging.logger?.error('Failed to delete file by ref', fileRef, ';\r\nERROR:', err);
        return false;
    }
}

export async function deleteAllFilesIn(targetBucket: BucketType, path: string) {
    Logging.logger?.log(`Deleting all files by path: ${targetBucket.name}/${path}`);
    const [files] = await targetBucket.getFiles({ prefix: path });
    await Promise.all(
        files.map(async file => {
            const filePath = file.name;
            await targetBucket.file(filePath).delete();
        }),
    );
}
