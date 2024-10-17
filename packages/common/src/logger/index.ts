import { ILogger, LoggerFunction } from './abstractions.js';
import { ConsoleLogger } from './console.js';
import { batchLoggers } from './batch.js';
import { LoggerModes, LoggersManager } from './manager.js';

export type { ILogger, LoggerFunction };
export { NamedLogger } from './named.js';
export { ConsoleLogger, batchLoggers };

const manager = new LoggersManager();

export function createLogger(name: string | undefined, mode: undefined | LoggerModes = undefined): ILogger {
    return manager.create(name, mode);
}

export function detachLogger(instance: ILogger, terminate = false) {
    return manager.detach(instance, terminate);
}

export function setMode(mode: LoggerModes | null | undefined) {
    manager.setMode(mode);
}

export function getMode() { return manager.mode; }

const logger: ILogger = createLogger(undefined, false);

export default logger;
