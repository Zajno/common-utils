import { ILogger } from './abstractions';

export function batchLoggers(...loggers: ILogger[]): ILogger {
    return {
        log: (...args) => loggers.forEach(l => l.log(...args)),
        warn: (...args) => loggers.forEach(l => l.warn(...args)),
        error: (...args) => loggers.forEach(l => l.error(...args)),
    };
}
