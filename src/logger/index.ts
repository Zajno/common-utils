import { ILogger, LoggerFunction } from './abstractions';
import { ConsoleLogger } from './console';

export { NamedLogger } from './named';
export { ILogger, LoggerFunction };
export { ConsoleLogger };

// TBD Introduce more logger types
export const Enabled = process.env.COMMON_UTILS_LOGGER === 'console';

export function createLogger(name = '', forceDisable = false): ILogger {
    const enabled = forceDisable ? false : Enabled;
    return new ConsoleLogger(name, enabled);
}

const logger = createLogger();

export default logger;
