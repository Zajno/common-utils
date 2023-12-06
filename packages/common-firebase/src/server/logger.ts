import { ILogger } from '@zajno/common/logger/index';
import { logger } from 'firebase-functions';

export const firebaseLogger: ILogger = {
    log: logger.log.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
};
