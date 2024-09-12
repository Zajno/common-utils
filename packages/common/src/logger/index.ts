import { ILogger, LoggerFunction } from './abstractions';
import { ConsoleLogger } from './console';
import { batchLoggers } from './batch';
import { LoggerModes, LoggersManager } from './manager';

export type { ILogger, LoggerFunction };
export { NamedLogger } from './named';
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
