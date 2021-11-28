import { ILogger } from './abstractions';
import { NamedLogger } from './named';

export const CONSOLE: ILogger = console;

export class ConsoleLogger extends NamedLogger {
    protected get implementation() { return CONSOLE; }
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
