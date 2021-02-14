
export type LoggerFunction = (...args: any[]) => void;
export type LogLevels = 'log' | 'warn' | 'error';

export interface ILogger {
    log: LoggerFunction;
    warn: LoggerFunction;
    error: LoggerFunction;
}

export interface IGenericLogger {
    print(level: LogLevels, ...args: any[]): void;
}
