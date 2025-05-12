import { Getter } from '../types/getter.js';
import { Nullable } from '../types/misc.js';
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

        const [originalName, ...rest] = args;
        const res = factory(
            this.getLoggerName(originalName),
            ...rest,
        );
        return this.setLogger(res);
    }

    protected getLoggerName(name: string | undefined) {
        return name ? `[${name}]` : '';
    }
}

/** Logger instance holder, for re-usability */
export class LoggerProvider extends Loggable {

    private _factory: ILoggerFactory | null = null;

    constructor(nameFormatter?: (name: string | undefined) => string, logger?: ILogger) {
        super(logger);
        if (nameFormatter) {
            this.getLoggerName = nameFormatter;
        }
    }

    public get logger(): ILogger | null {
        return super.logger;
    }

    public get factory(): ILoggerFactory | null {
        return this._factory;
    }

    public setLoggerFactory(factory: ILoggerFactory | null, ...args: Parameters<ILoggerFactory>): this {
        this._factory = factory;
        return super.setLoggerFactory(factory, ...args);
    }

    public createLogger(...args: Parameters<ILoggerFactory>) {
        return this._factory?.(...args) ?? null;
    }
}
