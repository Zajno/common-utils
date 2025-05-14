import { EMPTY_FUNCTION } from './empty.js';
import type { ILogger, ILoggerSwitchable, LoggerFunction } from './types.js';

export abstract class NamedLogger implements ILogger, ILoggerSwitchable {
    public log: LoggerFunction = EMPTY_FUNCTION;
    public warn: LoggerFunction = EMPTY_FUNCTION;
    public error: LoggerFunction = EMPTY_FUNCTION;

    private _name: string | null = null;
    private _enabled = false;

    get name() { return this._name; }

    constructor(name?: string) {
        this._name = name || null;
        this.disable();
    }

    protected abstract get implementation(): ILogger;
    public get isEnabled() { return this._enabled; }

    enable(overrideName: string | null = null) {
        this._name = overrideName || this._name;
        this._enabled = true;

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
        this._enabled = false;

        this.log = EMPTY_FUNCTION;
        this.warn = EMPTY_FUNCTION;
        this.error = EMPTY_FUNCTION;

        return this;
    }
}
