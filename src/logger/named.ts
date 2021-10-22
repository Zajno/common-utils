import { ILogger, ILoggerSwitchable, LoggerFunction } from './abstractions';

export const EMPTY_FUNCTION = () => { /* no-op */ };

function addArg(func: (...args: any[]) => any, value: string) {
    return (...args: any[]) => func(value, ...args);
}

export abstract class NamedLogger implements ILogger, ILoggerSwitchable {
    private _log: LoggerFunction = null;
    private _warn: LoggerFunction = null;
    private _error: LoggerFunction = null;

    private _name: string = null;

    get log() { return this._log; }
    get warn() { return this._warn; }
    get error() { return this._error; }

    get name() { return this._name; }

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
            ? addArg(this.logFunction.bind(this), this._name)
            : this.logFunction.bind(this);
        this._warn = this._name
            ? addArg(this.warnFunction.bind(this), this._name)
            : this.warnFunction.bind(this);
        this._error = this._name
            ? addArg(this.errorFunction.bind(this), this._name)
            : this.errorFunction.bind(this);
    }

    disable() {
        this._log = EMPTY_FUNCTION;
        this._warn = EMPTY_FUNCTION;
        this._error = EMPTY_FUNCTION;
    }
}
