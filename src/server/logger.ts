import { ILogger } from '@zajno/common/lib/logger';
import { logger } from 'firebase-functions';

export const firebaseLogger: ILogger = {
    log: logger.log.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
};
