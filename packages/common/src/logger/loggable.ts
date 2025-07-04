import { Getter } from '../types/getter.js';
import type { Nullable } from '../types/misc.js';
import { EMPTY_LOGGER } from './empty.js';
import type { ILogger, ILoggerFactory } from './types.js';

/** Helper base class for storing and using a logger instance. */
export class Loggable {

    private _logger: ILogger = EMPTY_LOGGER;

    constructor(logger?: ILogger) {
        if (logger) {
            this._logger = logger;
        }
    }

    /** Returns current logger ({@linkcode ILogger}), or {@link EMPTY_LOGGER} if not set via {@linkcode Loggable.setLogger} or {@linkcode Loggable.setLoggerFactory}. */
    protected get logger(): ILogger { return this._logger; }

    /** @returns Whether logger has been set */
    protected get hasLogger(): boolean { return !!this._logger && this._logger !== EMPTY_LOGGER; }

    public setLogger(logger: Getter<Nullable<ILogger>>) {
        const res = Getter.toValue(logger);
        this._logger = res ?? EMPTY_LOGGER;

        return this;
    }

    public setLoggerFactory(factory: ILoggerFactory | null, ...args: Parameters<ILoggerFactory>) {
        if (!factory) {
            return this.setLogger(null);
        }

        const res = this._createLogger(factory, ...args);
        return this.setLogger(res);
    }

    /** Override this method to customize logger name formatting which is used in {@link Loggable._createLogger} */
    protected getLoggerName(name: string | undefined) {
        return name ? `[${name}]` : '';
    }

    /** Helper for creating a logger instance with factory and params. */
    protected _createLogger(factory: ILoggerFactory, ...args: Parameters<ILoggerFactory>) {
        const [originalName, ...rest] = args;
        return factory(
            this.getLoggerName(originalName),
            ...rest,
        );
    }
}
