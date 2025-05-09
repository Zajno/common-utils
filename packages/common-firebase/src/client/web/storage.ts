import { createLogger } from '@zajno/common/logger/shared';
import { FirebaseApp, createFirebaseLazy, logger as rootLogger } from './app.js';
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

export const FirebaseStorageRaw = createFirebaseLazy(() => {
    const storageInstance = getStorage(FirebaseApp.Current);

    const emulator = FirebaseApp.Settings.storageEmulator;
    if (emulator?.url) {
        const { hostname, port } = new URL(emulator.url);
        rootLogger.log('Firebase Storage will use emulator:', emulator.url, '=>', hostname, port);
        connectStorageEmulator(storageInstance, hostname, +port);
    }

    return storageInstance;
});

const logger = createLogger('[Firebase.Storage]');

const NoOp = () => { /* no-op */ };

export const FirebaseStorage: IFirebaseStorage = {

    // TODO Add cache
    async getFileDownloadUlr(this: void, refPath: string): Promise<string | null> {
        try {
            const ref = getRef(FirebaseStorageRaw.value, refPath);
            const url = await getDownloadURL(ref);
            return url;
        } catch (err) {
            logger.warn('File for ref', refPath, 'was not found. See error below:\n', err);
            return null;
        }
    },

    generateFileNameByDate(this: void, extension: string, fileName?: string): string {
        const name = fileName || formatDate(new Date());

        const dotExtension = extension.startsWith('.')
            ? extension
            : ('.' + extension);

        const filename = `${name}${dotExtension}`;
        return filename;
    },

    async uploadFileFromLocalUri(this: void, uri: string, storagePath: string, progress?: ProgressListener) {
        const pp = progress || NoOp;
        pp(0);

        const f = await fetch(uri);
        const blob = await f.blob();

        const res = await FirebaseStorage.uploadFileFromBlob(blob, storagePath, progress);
        return res;
    },

    async uploadFileFromBlob(this: void, blob: Blob | string, storagePath: string, progress?: ProgressListener) {
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
            const res = await processTask(uploadTask, pp);
            size = res.totalBytes;
        }

        return {
            ref: fileRef.fullPath,
            size: size,
        };
    },
};

async function processTask(this: void, uploadTask: UploadTask, pp: ProgressListener) {
    pp(0);

    uploadTask.on('state_changed', snapshot => {
        const progress = snapshot.totalBytes > 0
            ? snapshot.bytesTransferred / snapshot.totalBytes
            : 0;
        pp(progress);
    });

    const res = await uploadTask;
    logger.log('File Uploaded! Result:', {
        // url: await res.ref.getDownloadURL(),
        size: res.totalBytes,
    });

    pp(1);

    return res;
}
