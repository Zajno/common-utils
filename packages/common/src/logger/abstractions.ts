
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
