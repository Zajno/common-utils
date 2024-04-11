import logger from '@zajno/common/logger/index';
import { FirebaseStorageBucket, StorageContext } from './firebase';

export async function removeDirectoryFromStorage(path: string): Promise<void> {
    if (!path) {
        throw Error('Invalid path');
    }

    logger.log(`Start deleting files :::: ${path}`);
    try {
        await StorageContext.bucket.deleteFiles({ prefix: path });
        logger.log('Files successfully deleted, path =', path);
    } catch (error) {
        logger.error('Error while deleting files fir path =', path, error);
    }
}

export async function deleteFile(fileRef: string) {
    const file = StorageContext.bucket.file(fileRef);
    try {
        logger.log('Deleting file by ref:', fileRef);
        await file.delete();
        return true;
    } catch (err) {
        logger.error('Failed to delete file by ref', fileRef, ';\r\nERROR:', err);
        return false;
    }
}

export async function deleteAllFilesIn(targetBucket: FirebaseStorageBucket, path: string) {
    logger.log(`Deleting all files by path: ${targetBucket.name}/${path}`);
    const [files] = await targetBucket.getFiles({ prefix: path });
    await Promise.all(
        files.map(async file => {
            const filePath = file.name;
            await targetBucket.file(filePath).delete();
        })
    );
}
