import { ILogger, LoggerFunction } from './abstractions';
import { CONSOLE, ConsoleLogger } from './console';
import { EMPTY_LOGGER, ProxyLogger } from './proxy';

export { NamedLogger } from './named';
export { ILogger, LoggerFunction };
export { ConsoleLogger };

// TBD Introduce more logger types ?
export type LoggerTypes = 'console';
export type LoggerFactory = (() => ILogger);

let Mode: LoggerTypes | false | LoggerFactory = process.env.COMMON_UTILS_LOGGER as LoggerTypes || false;

const proxies: ProxyLogger[] = [];

function _createImplementation(): ILogger {
    switch (Mode) {
        case 'console': {
            return CONSOLE;
        }

        case false: {
            return EMPTY_LOGGER;
        }

        default: {
            if (typeof Mode === 'function') {
                return Mode();
            }

            return undefined;
        }
    }
}

export function createLogger(name: string, forceDisable = false): ILogger {
    const result = _createImplementation();
    const proxy = new ProxyLogger(result, name, !forceDisable);
    proxies.push(proxy);
    return proxy;
}

export function setMode(mode: typeof Mode) {
    if (Mode === mode) {
        return;
    }

    Mode = mode;

    if (!Mode) {
        proxies.forEach(l => l.disable());
    } else {
        proxies.forEach(l => l.setLogger(_createImplementation()));
    }
}

export function getMode() { return Mode; }

const logger: ILogger = createLogger('', false);

export default logger;
