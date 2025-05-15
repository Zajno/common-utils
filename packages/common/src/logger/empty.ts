import type { ILogger, LoggerFunction } from './types.js';

export const EMPTY_FUNCTION: LoggerFunction = () => { /* no-op */ };

export const EMPTY_LOGGER: ILogger = {
    log: EMPTY_FUNCTION,
    warn: EMPTY_FUNCTION,
    error: EMPTY_FUNCTION,
};
