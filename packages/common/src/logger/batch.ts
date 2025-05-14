import type { Nullable } from '../types/misc.js';
import type { ILogger } from './types.js';
import { EMPTY_LOGGER } from './empty.js';

export function batchLoggers(...loggers: Nullable<ILogger>[]): ILogger {
    const filtered = loggers.filter(l => !!l);
    if (filtered.length === 0) {
        return EMPTY_LOGGER;
    }

    if (filtered.length === 1) {
        return filtered[0];
    }

    return {
        log: (...args: any[]) => {
            for (let i = 0, len = filtered.length; i < len; ++i) {
                filtered[i].log(...args);
            }
        },
        warn: (...args: any[]) => {
            for (let i = 0, len = filtered.length; i < len; ++i) {
                filtered[i].warn(...args);
            }
        },
        error: (...args: any[]) => {
            for (let i = 0, len = filtered.length; i < len; ++i) {
                filtered[i].error(...args);
            }
        },
    };
}
