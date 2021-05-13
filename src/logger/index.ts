import { ILogger, ILoggerSwitchable, LoggerFunction } from './abstractions';
import { ConsoleLogger } from './console';

export { NamedLogger } from './named';
export { ILogger, LoggerFunction };
export { ConsoleLogger };

// TBD Introduce more logger types ?
export type LoggerTypes = 'console';

let Enabled: LoggerTypes | false = process.env.COMMON_UTILS_LOGGER as LoggerTypes || false;

const createdLoggers: ILoggerSwitchable[] = [];

function _create(name: string, forceDisable: boolean) {
    switch (Enabled) {
        case 'console': {
            return new ConsoleLogger(name, !forceDisable);
        }

        default: {
            return new ConsoleLogger(name, false);
        }
    }
}

export function createLogger(name = '', forceDisable = false): ILogger {
    const result = _create(name, forceDisable);
    createdLoggers.push(result);
    return result;
}

const logger = new ConsoleLogger('', !!Enabled);
createdLoggers.push(logger);

export function setEnabled(enabled: LoggerTypes | false) {
    Enabled = enabled;

    if (!Enabled) {
        createdLoggers.forEach(l => l.disable());
    } else {
        createdLoggers.forEach(l => l.enable());
    }
}

export default logger as ILogger;
