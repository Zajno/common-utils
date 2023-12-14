import { Getter } from '../types';
import { ILogger, LoggerFunction } from './abstractions';
import { CONSOLE, ConsoleLogger } from './console';
import { ProxyLogger } from './proxy';
import { batchLoggers } from './batch';
import { removeItem } from '../math';

export type { ILogger, LoggerFunction };
export { NamedLogger } from './named';
export { ConsoleLogger, batchLoggers };

// TBD Introduce more logger types ?
export type LoggerTypes = 'console';

let Mode: LoggerTypes | false | Getter<ILogger> = false;

const proxies: ProxyLogger[] = [];

export function createLogger(name: string | undefined, mode: undefined | typeof Mode = undefined): ILogger {
    const result = _createImplementation(mode);
    const proxy = new ProxyLogger(result, name);
    proxies.push(proxy);
    return proxy;
}

export function detachLogger(instance: ILogger, terminate = false) {
    const item = removeItem(proxies, instance as ProxyLogger);
    if (item) {
        if (terminate) {
            item.disable();
        }
        return true;
    }
    return false;
}

export function setMode(mode: typeof Mode | null | undefined) {
    if (Mode === mode) {
        return;
    }

    Mode = mode || false;

    if (!Mode) {
        proxies.forEach(l => l.disable());
    } else {
        proxies.forEach(l => l.setLogger(_createImplementation()));
    }
}

export function getMode() { return Mode; }

const logger: ILogger = createLogger(undefined, false);

export default logger;

function _createImplementation(overrideMode: undefined | typeof Mode = undefined): ILogger | null {
    const mode = overrideMode !== undefined ? overrideMode : Mode;
    switch (mode) {
        case 'console': {
            return CONSOLE;
        }

        case false: {
            return null;
        }

        default: {
            return Getter.getValue(mode);
        }
    }
}
