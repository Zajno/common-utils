import type { Getter } from '../types/getter.js';

export type LoggerFunction = (...args: any[]) => void;

export interface ILogger {
    log: LoggerFunction;
    warn: LoggerFunction;
    error: LoggerFunction;
}

export interface ILoggerSwitchable {
    enable(): void;
    disable(): void;
}

// TBD Introduce more logger types ?
export type LoggerTypes = 'console';

export type LoggerModes = LoggerTypes // default JS logger types
    | false // disabled
    | Getter<ILogger>; // custom instance or factory

export type ILoggerFactory = (name: string | undefined, mode?: LoggerModes) => ILogger;
