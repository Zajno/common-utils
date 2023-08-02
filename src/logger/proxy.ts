import { ILogger } from './abstractions';
import { EMPTY_FUNCTION, NamedLogger } from './named';

export const EMPTY_LOGGER: ILogger = {
    log: EMPTY_FUNCTION,
    warn: EMPTY_FUNCTION,
    error: EMPTY_FUNCTION,
};

export class ProxyLogger extends NamedLogger {

    protected get implementation() { return this._logger || EMPTY_LOGGER; }

    private _logger: ILogger = null;

    constructor(logger: ILogger, name: string) {
        super(name);
        this.setLogger(logger);
    }

    public setLogger(logger: ILogger) {
        this._logger = logger || null;
        if (this._logger) {
            this.enable();
        } else {
            this.disable();
        }
    }
}
