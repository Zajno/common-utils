import { Loggable } from './loggable.js';
import type { ILogger, ILoggerFactory } from './types.js';


/** Logger instance holder, for re-usability */
export class LoggerProvider extends Loggable {

    private _factory: ILoggerFactory | null = null;

    constructor(nameFormatter?: (name: string | undefined) => string, logger?: ILogger) {
        super(logger);
        if (nameFormatter) {
            this.getLoggerName = nameFormatter;
        }
    }

    // changing visibility to public
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
        if (!this._factory) {
            return null;
        }
        return this._createLogger(this._factory, ...args);
    }
}
