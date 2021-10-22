import { ILogger, LoggerFunction } from './abstractions';
import { ConsoleLogger, CustomLogger } from './console';

export { NamedLogger } from './named';
export { ILogger, LoggerFunction };
export { ConsoleLogger };

// TBD Introduce more logger types ?
export type LoggerTypes = 'console';
export type LoggerFactory = ((name?: string, enabled?: boolean) => ILogger);
let Mode: LoggerTypes | false | LoggerFactory = process.env.COMMON_UTILS_LOGGER as LoggerTypes || false;

const createdLoggers: CustomLogger[] = [];

function _create(name: string, forceDisable: boolean) {

    switch (Mode) {
        case 'console': {
            return new ConsoleLogger(name, !forceDisable);
        }

        case false: {
            return new CustomLogger(null);
        }

        default: {
            if (typeof Mode === 'function') {
                return Mode(name, !forceDisable);
            }

            return undefined;
        }
    }
}

const logger = new CustomLogger(null);
createdLoggers.push(logger);

export function createLogger(name: string, forceDisable = false): ILogger {
    const result = _create(name, forceDisable);
    const customLogger = new CustomLogger(result, name, !forceDisable);
    createdLoggers.push(customLogger);
    return customLogger;
}

export function setMode(mode: typeof Mode) {
    if (Mode === mode) {
        return;
    }

    Mode = mode;

    if (!Mode) {
        createdLoggers.forEach(l => l.disable());
    } else {
        createdLoggers.forEach(l => l.logger = _create(l.name, false));
    }
}

export default logger as ILogger;
