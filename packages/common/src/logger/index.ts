import { ILogger, LoggerFunction } from './abstractions.js';
import { ConsoleLogger } from './console.js';
import { batchLoggers } from './batch.js';
import { LoggerModes, LoggersManager } from './manager.js';

export type { ILogger, LoggerFunction, LoggerModes };
export { NamedLogger } from './named.js';
export { ConsoleLogger, batchLoggers };
export { LoggersManager };

/** Shared logger instance used internally in this library.
 *
 * For internal default loggers to be enabled and working, don't forget to set the mode to this instance.
*/
export * as SharedLogger from './shared.js';
