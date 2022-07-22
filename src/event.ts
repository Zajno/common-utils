import './async/arrays';
import { forEachAsync } from './async/arrays';
import { ILogger, createLogger } from './logger';

export type EventHandler<T = any> = (data?: T) => void | Promise<void>;

export interface IEvent<T = any> {
    on(handler: EventHandler<T>): () => void;
    off(handler: EventHandler<T>): void;
}

export class Event<T = any> implements IEvent<T> {
    private _handlers: EventHandler<T>[] = [];
    private _logger: ILogger = null;

    constructor();
    constructor(logger?: ILogger);
    constructor(name?: string);

    constructor(loggerOrName?: ILogger | string) {
        this._logger = (!loggerOrName || typeof loggerOrName === 'string')
            ? createLogger(`[Event:${loggerOrName || '?'}]`)
            : loggerOrName;
    }

    public on(handler: EventHandler<T>): () => void {
        this._handlers.push(handler);
        return () => {
            this.off(handler);
        };
    }

    public off(handler: EventHandler<T>): void {
        this._handlers = this._handlers.filter(h => h !== handler);
    }

    public trigger(data?: T) {
        if (!this._handlers.length) {
            return;
        }

        const hh = this._handlers.slice(0);
        hh.forEach(cb => {
            try {
                cb(data);
            } catch (err) {
                this.logError(data, cb, err);
            }
        });
    }

    public async triggerAsync(data?: T): Promise<Error[]> {
        if (!this._handlers.length) {
            return [];
        }

        const hh = this._handlers.slice(0);

        const errors: Error[] = [];

        await forEachAsync(hh, async (cb: EventHandler<T>) => {
            try {
                await cb(data);
            } catch (err) {
                this.logError(data, cb, err);
                errors.push(err);
            }
        });

        return errors;
    }

    public expose(): IEvent<T> {
        return this;
    }

    private logError(data: T, cb: EventHandler<T>, err: Error) {
        this._logger.error(`[Event.${typeof data}] Handler ${cb.name} thrown an exception: `, err);
    }
}
