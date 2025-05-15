import type { ILogger, ILoggerFactory, LoggerFunction, LoggerModes } from './types.js';
import { ConsoleLogger } from './console.js';
import { batchLoggers } from './batch.js';
import { LoggersManager } from './manager.js';
import { Loggable } from './loggable.js';
import { LoggerProvider } from './provider.js';

export type { ILogger, ILoggerFactory, LoggerFunction, LoggerModes };
export { NamedLogger } from './named.js';
export {
    ConsoleLogger,
    batchLoggers,
    LoggersManager,
    Loggable,
    LoggerProvider,
};
