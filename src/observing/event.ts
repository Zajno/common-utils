import type { Predicate } from '../types';
import { forEachAsync } from '../async/arrays';
import { ILogger, createLogger } from '../logger';

export type EventHandler<T = any> = (data?: T) => void | Promise<void>;
type Unsubscribe = () => void;

export interface IEvent<T = any> {
    on(handler: EventHandler<T>): () => void;
    off(handler: EventHandler<T>): void;
}

export class Event<T = any> implements IEvent<T> {
    private _handlers: EventHandler<T>[] = [];
    private _logger: ILogger = null;

    constructor(withDefaultLogger = true) {
        if (withDefaultLogger) {
            this.withLogger();
        }
    }

    public withLogger(logger?: ILogger): this;
    public withLogger(name?: string): this;

    public withLogger(loggerOrName: ILogger | string) {
        this._logger = (!loggerOrName || typeof loggerOrName === 'string')
            ? createLogger(`[Event:${loggerOrName || '?'}]`)
            : loggerOrName;
        return this;
    }

    public on(handler: EventHandler<T>): Unsubscribe {
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
        this._logger?.error(`[Event.${typeof data}] Handler ${cb.name} thrown an exception: `, err);
    }
}

export function oneTimeSubscription<T>(e: IEvent<T>, filter?: Predicate<T>): Promise<T> {
    return new Promise<T>((resolve) => {
        let unsubscribe: Unsubscribe = null;
        unsubscribe = e.on(v => {
            if (!filter || filter(v)) {
                // the callback can be called during subscription, so unsubscribe may not be initialized yet.
                // in that case assume that unsubscribing is not needed
                unsubscribe?.();
                resolve(v);
            }
        });
    });
}
