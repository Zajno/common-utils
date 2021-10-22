import { ILogger, LoggerFunction } from './abstractions';
import { EMPTY_FUNCTION, NamedLogger } from './named';

const CONSOLE = console;

export class ConsoleLogger extends NamedLogger {

    protected get logFunction(): LoggerFunction { return CONSOLE.log; }
    protected get warnFunction(): LoggerFunction { return CONSOLE.warn; }
    protected get errorFunction(): LoggerFunction { return CONSOLE.error; }

    constructor(name?: string, enabled = true) {
        super(name, enabled);
    }
}

export class CustomLogger extends NamedLogger {

    protected get logFunction(): LoggerFunction { return this.logger ? () => this.logger.log : EMPTY_FUNCTION; }
    protected get warnFunction(): LoggerFunction { return this.logger ? () => this.logger.warn : EMPTY_FUNCTION; }
    protected get errorFunction(): LoggerFunction { return this.logger ? () => this.logger.error : EMPTY_FUNCTION; }

    constructor(public logger: ILogger, name?: string, enabled = true) {
        super(name, enabled);
    }
}

export class BufferedConsoleLogger implements ILogger {
    private readonly _name: string = null;
    private readonly _logs: string[] = [];
    private _level = 1;

    private _log = CONSOLE.log;

    constructor(name: string) {
        this._name = name || '';
    }

    log(...args: any[]) {
        this._logs.push('\t--->', ...args);
    }

    warn(...args: any[]) {
        this._logs.push('\t---> [WARN]', ...args);
        this._raiseLevel(2);
    }

    error(...args: any[]) {
        this._logs.push('\t---> [ERROR]', ...args);
        this._raiseLevel(3);
    }

    flush() {
        if (this._logs.length > 0) {
            this._log(this._name, ...this._logs);
            this._logs.length = 0;
        }
    }

    private _raiseLevel(l: number) {
        if (l > this._level) {
            this._level = l;
            if (l >= 3) {
                this._log = CONSOLE.error;
            } else if (l >= 2) {
                this._log = CONSOLE.warn;
            }
        }
    }
}
