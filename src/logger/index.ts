import { ILogger, LoggerFunction } from './abstractions';
import { ConsoleLogger } from './console';

export { NamedLogger } from './named';
export { ILogger, LoggerFunction };
export { ConsoleLogger };

export const Enabled = process.env.NODE_ENV !== 'production';

export function createLogger(name = '', forceDisable = false): ILogger {
    const enabled = forceDisable ? false : Enabled;
    return new ConsoleLogger(name, enabled);
}

const logger = createLogger();

export default logger;
