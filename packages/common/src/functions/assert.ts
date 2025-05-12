import { Getter, type Nullable } from '../types/index.js';
import { ILogger } from '../logger/types.js';

type AssertFn = (condition: boolean, error: Getter<string | Error>, objectToLog?: Getter<any>) => asserts condition;

export function createAssert(logger?: Nullable<ILogger>): AssertFn {
    return function assert(condition: boolean, error: Getter<string | Error>, objectToLog?: Getter<any>): asserts condition {
        if (condition) {
            return;
        }

        const e = Getter.toValue(error);
        if (objectToLog && logger) {
            logger.error('Assertion failed:', e, Getter.toValue(objectToLog));
        }

        if (typeof e === 'string') {
            throw new Error(e);
        }

        throw e;
    };
}

export const assert: AssertFn = createAssert();
