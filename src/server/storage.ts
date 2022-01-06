import logger from '@zajno/common/lib/logger';
import { StorageContext } from './firebase';

export async function removeDirectoryFromStorage(path: string): Promise<void> {
    if (!path) {
        throw Error('Invalid path');
    }

    logger.log(`Start deleting files :::: ${path}`);
    try {
        await StorageContext.bucket.deleteFiles({ directory: path });
        logger.log(`Files successfully deleted :::: ${path}`);
    } catch (error) {
        logger.error(`Error while deleting files :::: ${path} :::: ${error}`);
    }
}
