import { ILogger } from './abstractions.js';
import { LoggerModes, LoggersManager } from './manager.js';

// convenience re-exports
export type { ILogger, LoggerModes };

const exposed = new LoggersManager().expose();

/** @deprecated Uses shared `LoggersManager` instance, it's better to create your own. */
export const createLogger = exposed.createLogger;

/** @deprecated Uses shared `LoggersManager` instance, it's better to create your own. */
export const detachLogger = exposed.detachLogger;

/** @deprecated Uses shared `LoggersManager` instance, it's better to create your own. */
export const setMode = exposed.setMode;

/** @deprecated Uses shared `LoggersManager` instance, it's better to create your own. */
export const getMode = exposed.getMode;

/** @deprecated Uses shared `LoggersManager` instance, it's better to create your own. */
const logger: ILogger = exposed.logger;

/** @deprecated Uses shared `LoggersManager` instance, it's better to create your own. */
export default logger;
