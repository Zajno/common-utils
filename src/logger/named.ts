import { ILogger, LoggerFunction } from './abstractions';

const EMPTY_FUNCTION = () => { /* no-op */ };

function addArg(func: (...args: any[]) => any, value: string) {
    return (...args: any[]) => func(value, ...args);
}

export abstract class NamedLogger implements ILogger {
    private _log: LoggerFunction;
    private _warn: LoggerFunction;
    private _error: LoggerFunction;

    private _name: string;

    get log() { return this._log; }
    get warn() { return this._warn; }
    get error() { return this._error; }

    protected abstract get logFunction(): LoggerFunction;
    protected abstract get warnFunction(): LoggerFunction;
    protected abstract get errorFunction(): LoggerFunction;

    constructor(name?: string, enabled = true) {
        this._name = name;

        if (enabled) {
            this.enable();
        } else {
            this.disable();
        }
    }

    enable(overrideName = null) {
        this._name = overrideName || this._name;

        this._log = this._name
            ? addArg(this.logFunction, this._name)
            : this.logFunction;
        this._warn = this._name
            ? addArg(this.warnFunction, this._name)
            : this.warnFunction;
        this._error = this._name
            ? addArg(this.errorFunction, this._name)
            : this.errorFunction;
    }

    disable() {
        this._log = EMPTY_FUNCTION;
        this._warn = EMPTY_FUNCTION;
        this._error = EMPTY_FUNCTION;
    }
}
