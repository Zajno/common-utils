import type { Getter } from '../types/getter.js';

export type LoggerFunction = (...args: any[]) => void;

export interface ILogger {
    readonly log: LoggerFunction;
    readonly warn: LoggerFunction;
    readonly error: LoggerFunction;
}

export interface ILoggerSwitchable {
    enable(): void;
    disable(): void;
}

export type LogLevelTypes = keyof ILogger;

export const LogLevels = {
    log: 1,
    warn: 2,
    error: 3,
} as const satisfies Record<LogLevelTypes, number>;
export type LogLevelValues = typeof LogLevels[LogLevelTypes];

// TBD Introduce more logger types ?
export type LoggerTypes = 'console';

export type LoggerModes = LoggerTypes // default JS logger types
    | false // disabled
    | Getter<ILogger>; // custom instance or factory

export type ILoggerFactory = (name: string | undefined, mode?: LoggerModes) => ILogger;
