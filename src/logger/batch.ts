import { ILogger } from './abstractions';

export function batchLoggers(...loggers: ILogger[]): ILogger {
    return {
        log: (...args: any[]) => loggers.forEach(l => l.log(...args)),
        warn: (...args: any[]) => loggers.forEach(l => l.warn(...args)),
        error: (...args: any[]) => loggers.forEach(l => l.error(...args)),
    };
}
