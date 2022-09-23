import { Getter } from './types';
import logger from './logger';

export function assert(condition: boolean, error: Getter<string | Error>, objectToLog?: Getter<any>): asserts condition {
    if (condition) {
        return;
    }

    const e = Getter.getValue(error);
    if (objectToLog) {
        logger.error('Assertion failed:', e, Getter.getValue(objectToLog));
    }

    if (typeof e === 'string') {
        throw new Error(e);
    }

    throw e;
}
