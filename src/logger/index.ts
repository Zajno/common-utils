import { IGenericLogger, ILogger, LoggerFunction, LogLevels } from './abstractions';
import { ConsoleLogger } from './console';
import { AlertsLogger } from './alerts';

export { ILogger, LogLevels, LoggerFunction };
export { ConsoleLogger };

export const Enabled = process.env.NODE_ENV !== 'production';
const USE_ALERT_LOGGER = false;

export function createLogger(name = '', forceDisable = false): ILogger & IGenericLogger {
    const enabled = forceDisable ? false : Enabled;
    return USE_ALERT_LOGGER
        ? new AlertsLogger(name, enabled)
        : new ConsoleLogger(name, enabled);
}

const logger = createLogger();

export default logger;
