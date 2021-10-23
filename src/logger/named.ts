import { ILogger, ILoggerSwitchable, LoggerFunction } from './abstractions';

export const EMPTY_FUNCTION = () => { /* no-op */ };

export abstract class NamedLogger implements ILogger, ILoggerSwitchable {
    public log: LoggerFunction = null;
    public warn: LoggerFunction = null;
    public error: LoggerFunction = null;

    private _name: string = null;

    get name() { return this._name; }

    protected abstract get implementation(): ILogger;

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

        this.log = this._name
            ? (...args) => this.implementation.log(this._name, ...args)
            : (...args) => this.implementation.log(...args);

        this.warn = this._name
            ? (...args) => this.implementation.warn(this._name, ...args)
            : (...args) => this.implementation.warn(...args);

        this.error = this._name
            ? (...args) => this.implementation.error(this._name, ...args)
            : (...args) => this.implementation.error(...args);
    }

    disable() {
        this.log = EMPTY_FUNCTION;
        this.warn = EMPTY_FUNCTION;
        this.error = EMPTY_FUNCTION;
    }
}
