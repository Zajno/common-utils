import { ILogger, LoggerFunction } from './abstractions';
import { ConsoleLogger } from './console';

export { NamedLogger } from './named';
export { ILogger, LoggerFunction };
export { ConsoleLogger };

// TBD Introduce more logger types ?
export type LoggerTypes = 'console';

let Enabled: LoggerTypes | false = process.env.COMMON_UTILS_LOGGER as LoggerTypes || false;

export function createLogger(name = '', forceDisable = false): ILogger {
    switch (Enabled) {
        case 'console': {
            return new ConsoleLogger(name, !forceDisable);
        }

        default: {
            return new ConsoleLogger(name, false);
        }
    }
}

const logger = new ConsoleLogger('', !!Enabled);

export function setEnabled(enabled: LoggerTypes | false) {
    Enabled = enabled;

    if (!Enabled) {
        logger.disable();
    } else {
        logger.enable();
    }
}

export default logger;
