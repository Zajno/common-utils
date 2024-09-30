import Firebase, { FirebaseApp } from '../firebase';
import { createLogger } from '@zajno/common/logger/index';
import { createLazy } from '@zajno/common/lazy/light';

const logger = createLogger('[Storage]');

/* global fetch */

type UploadTask = FirebaseApp.storage.UploadTask;

export type FileUploadResult = {
    ref: string,
    size: number,
};

export type ProgressListener = (progress: number) => void;

const NoOp = () => { /* no-op */ };

export interface IStorageController {
    getFileDownloadUlr(refPath: string): Promise<string | null>;

    uploadFileFromLocalUri(uri: string, storagePath: string, progress?: ProgressListener): Promise<FileUploadResult>;
    uploadFileFromBlob(blob: Blob, storagePath: string, progress?: ProgressListener): Promise<FileUploadResult>;

    generateFileNameByDate(dotExtension: string): string;
}

function formatDate(date: Date) {
    const pad = (n: number, count = 2) => n.toString().padStart(count, '0');

    const y = pad(date.getUTCFullYear(), 4);
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());

    const hr = pad(date.getUTCHours());
    const min = pad(date.getUTCMinutes());
    const sec = pad(date.getUTCSeconds());

    return `${y}.${m}.${d}_${hr}.${min}.${sec}`;
}

export class StorageController implements IStorageController {

    private static _instance = createLazy(() => new StorageController());

    public static get Instance() { return StorageController._instance.value; }

    // TODO Add cache
    async getFileDownloadUlr(refPath: string): Promise<string | null> {
        try {
            const ref = Firebase.Instance.storage.ref(refPath);
            const url = await ref.getDownloadURL();
            return url;
        } catch (_err) {
            logger.warn('File for ref', refPath, 'was not found');
            return null;
        }
    }

    generateFileNameByDate(extension: string): string {
        const now = new Date();
        const nowStr = formatDate(now);

        const dotExtension = extension.startsWith('.')
            ? extension
            : ('.' + extension);

        const filename = `${nowStr}${dotExtension}`;
        return filename;
    }

    private async processTask(uploadTask: UploadTask, pp: ProgressListener) {
        pp(0);

        uploadTask.on(Firebase.Instance.types.FirebaseStorage.TaskEvent.STATE_CHANGED, snapshot => {
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

    async uploadFileFromLocalUri(uri: string, storagePath: string, progress: ProgressListener | null = null) {
        const pp = progress || NoOp;
        pp(0);

        const f = await fetch(uri);
        const blob = await f.blob();

        const res = await this.uploadFileFromBlob(blob, storagePath, progress);
        return res;
    }

    async uploadFileFromBlob(blob: Blob, storagePath: string, progress: ProgressListener | null = null) {
        const pp = progress || NoOp;

        const fileRef = Firebase.Instance.storage.ref(storagePath);
        const uploadTask = fileRef.put(blob);

        const res = await this.processTask(uploadTask, pp);

        return {
            ref: fileRef.fullPath,
            size: res.totalBytes,
        };
    }
}
