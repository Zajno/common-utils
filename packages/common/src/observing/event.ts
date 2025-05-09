import type { Predicate } from '../types/index.js';
import { forEachAsync } from '../async/arrays.js';
import { ILogger, createLogger } from '../logger/shared.js';
import { catchPromise } from '../functions/safe.js';

export type EventHandler<T = any> = (data?: T) => void | Promise<void>;
type Unsubscribe = () => void;

export interface IEvent<T = any> {
    on(handler: EventHandler<T>): () => void;
    off(handler: EventHandler<T>): void;
}

export class Event<T = any> implements IEvent<T> {
    private _handlers: EventHandler<T>[] = [];
    private _logger: ILogger | null = null;

    constructor(withDefaultLogger = true) {
        if (withDefaultLogger) {
            this.withLogger('');
        }
    }

    public get isEmpty() { return this._handlers.length === 0; }

    public withLogger(logger?: ILogger | null): this;
    public withLogger(name?: string | null): this;

    public withLogger(loggerOrName: ILogger | string | null | undefined) {
        if (loggerOrName == null) {
            this._logger = null;
            return this;
        }

        this._logger = typeof loggerOrName === 'string'
            ? createLogger(`[Event:${loggerOrName || '?'}]`)
            : loggerOrName;
        return this;
    }

    /** Clears handlers list */
    public resetHandlers = () => {
        this._handlers = [];
    };

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
                catchPromise(cb(data), err => this.logError(data, cb, err));
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

        await forEachAsync(hh, async (cb: EventHandler<T>, index: number) => {
            try {
                await cb(data);
            } catch (err) {
                this.logError(data, cb, err);
                if (err instanceof Error) {
                    errors[index] = err;
                } else if (typeof err === 'string') {
                    errors[index] = new Error(err);
                } else {
                    errors[index] = new Error(`Event handler thrown an exception: ${err as any}`);
                }
            }
        });

        return errors;
    }

    public expose(): IEvent<T> {
        return this;
    }

    private logError(data: T | null | undefined, cb: EventHandler<T>, err: unknown) {
        this._logger?.error(`[Event.${typeof data}] Handler ${cb.name} thrown an exception: `, err);
    }
}

export function oneTimeSubscription<T>(e: IEvent<T>, filter?: Predicate<T | undefined>): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve) => {
        let unsubscribe: Unsubscribe | null = null;
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
