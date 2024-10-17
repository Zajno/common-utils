import { ILogger } from './abstractions.js';
import { EMPTY_FUNCTION, NamedLogger } from './named.js';

export const EMPTY_LOGGER: ILogger = {
    log: EMPTY_FUNCTION,
    warn: EMPTY_FUNCTION,
    error: EMPTY_FUNCTION,
};

export class ProxyLogger extends NamedLogger {

    protected get implementation() { return this._logger || EMPTY_LOGGER; }

    private _logger: ILogger | null = null;

    constructor(logger: ILogger | undefined | null, name: string | undefined = undefined) {
        super(name);
        this.setLogger(logger);
    }

    public setLogger(logger: ILogger | undefined | null) {
        this._logger = logger || null;
        if (this._logger) {
            this.enable();
        } else {
            this.disable();
        }
    }
}
