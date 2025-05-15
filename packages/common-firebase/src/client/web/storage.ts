import { FirebaseApp, createFirebaseLazy } from './app.js';
import {
    getStorage,
    connectStorageEmulator,
    ref as getRef,
    uploadBytesResumable,
    uploadString,
    getDownloadURL,
} from 'firebase/storage';
import type { UploadTask } from 'firebase/storage';
import {
    formatDate,
    IFirebaseStorage,
    ProgressListener,
} from '../abstractions/storage/index.js';
import { Loggable } from '@zajno/common/logger';

export const FirebaseStorageRaw = createFirebaseLazy(() => {
    const storageInstance = getStorage(FirebaseApp.Current);

    const emulator = FirebaseApp.Settings.storageEmulator;
    if (emulator?.url) {
        const { hostname, port } = new URL(emulator.url);
        FirebaseApp.logger?.log('Firebase Storage will use emulator:', emulator.url, '=>', hostname, port);
        connectStorageEmulator(storageInstance, hostname, +port);
    }

    return storageInstance;
});

const NoOp = () => { /* no-op */ };

export class FirebaseStorage extends Loggable implements IFirebaseStorage {

    // TODO Add cache
    async getFileDownloadUrl(refPath: string): Promise<string | null> {
        try {
            const ref = getRef(FirebaseStorageRaw.value, refPath);
            const url = await getDownloadURL(ref);
            return url;
        } catch (err) {
            this.logger?.warn('File for ref', refPath, 'was not found. See error below:\n', err);
            return null;
        }
    }

    generateFileNameByDate(extension: string, fileName?: string): string {
        const name = fileName || formatDate(new Date());

        const dotExtension = extension.startsWith('.')
            ? extension
            : ('.' + extension);

        const filename = `${name}${dotExtension}`;
        return filename;
    }

    async uploadFileFromLocalUri(uri: string, storagePath: string, progress?: ProgressListener) {
        const pp = progress || NoOp;
        pp(0);

        const f = await fetch(uri);
        const blob = await f.blob();

        const res = await this.uploadFileFromBlob(blob, storagePath, progress);
        return res;
    }

    async uploadFileFromBlob(blob: Blob | string, storagePath: string, progress?: ProgressListener) {
        const pp = progress || NoOp;

        const fileRef = getRef(FirebaseStorageRaw.value, storagePath);
        let size = 0;

        if (typeof blob === 'string') {
            pp(0);
            await uploadString(fileRef, blob, 'data_url');
            size = blob.length; // not correct
            pp(1);
        } else {
            const uploadTask = uploadBytesResumable(fileRef, blob);
            const res = await this.processTask(uploadTask, pp);
            size = res.totalBytes;
        }

        return {
            ref: fileRef.fullPath,
            size: size,
        };
    }

    private async processTask(uploadTask: UploadTask, pp: ProgressListener) {
        pp(0);

        uploadTask.on('state_changed', snapshot => {
            const progress = snapshot.totalBytes > 0
                ? snapshot.bytesTransferred / snapshot.totalBytes
                : 0;
            pp(progress);
        });

        const res = await uploadTask;
        this.logger?.log('File Uploaded! Result:', {
            // url: await res.ref.getDownloadURL(),
            size: res.totalBytes,
        });

        pp(1);

        return res;
    }
};
