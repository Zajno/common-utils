import { ILogger, ILoggerSwitchable, LoggerFunction } from './abstractions.js';

export const EMPTY_FUNCTION = () => { /* no-op */ };

export abstract class NamedLogger implements ILogger, ILoggerSwitchable {
    public log: LoggerFunction = EMPTY_FUNCTION;
    public warn: LoggerFunction = EMPTY_FUNCTION;
    public error: LoggerFunction = EMPTY_FUNCTION;

    private _name: string | null = null;

    get name() { return this._name; }

    protected abstract get implementation(): ILogger;

    constructor(name?: string) {
        this._name = name || null;
        this.disable();
    }

    enable(overrideName: string | null = null) {
        this._name = overrideName || this._name;

        this.log = this._name
            ? (...args) => this.implementation.log(this._name, ...args)
            : this.implementation.log;

        this.warn = this._name
            ? (...args) => this.implementation.warn(this._name, ...args)
            : this.implementation.warn;

        this.error = this._name
            ? (...args) => this.implementation.error(this._name, ...args)
            : this.implementation.error;

        return this;
    }

    disable() {
        this.log = EMPTY_FUNCTION;
        this.warn = EMPTY_FUNCTION;
        this.error = EMPTY_FUNCTION;

        return this;
    }
}
