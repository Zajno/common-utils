import { Getter } from '../types/getter.js';
import type { Nullable } from '../types/misc.js';
import type { ILogger, ILoggerFactory } from './types.js';

/** Helper base class for storing and using a logger instance. */
export class Loggable {

    private _logger: ILogger | null = null;

    constructor(logger?: ILogger) {
        if (logger) {
            this.setLogger(logger);
        }
    }

    protected get logger() { return this._logger; }

    public setLogger(logger?: Getter<Nullable<ILogger>>) {
        if (!logger) {
            this._logger = null;
        } else {
            this._logger = Getter.toValue(logger) ?? null;
        }

        return this;
    }

    public setLoggerFactory(factory: ILoggerFactory | null, ...args: Parameters<ILoggerFactory>) {
        if (!factory) {
            return this.setLogger(null);
        }

        const res = this._createLogger(factory, ...args);
        return this.setLogger(res);
    }

    protected getLoggerName(name: string | undefined) {
        return name ? `[${name}]` : '';
    }

    protected _createLogger(factory: ILoggerFactory, ...args: Parameters<ILoggerFactory>) {
        const [originalName, ...rest] = args;
        return factory(
            this.getLoggerName(originalName),
            ...rest,
        );
    }
}
