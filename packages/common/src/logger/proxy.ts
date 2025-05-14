import type { ILogger } from './types.js';
import { NamedLogger } from './named.js';
import { EMPTY_LOGGER } from './empty.js';

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
