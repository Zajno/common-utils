import { catchPromise } from '../functions/safe.js';
import { Event, EventHandler } from './event.js';

/**
 * One-time event that can be triggered only once, but listeners will be notified at the time of event or subscription, if it happens later.
 *
 * Useful for solving race conditions, when components initialization order is undetermined.
 *
 * Example usage: app initialization finished event, but some async components can subscribe later and be notified;
 * So subscribers can be sure that the main initialization is finished.
 */
export class OneTimeLateEvent<T = any> extends Event<T> {

    private _triggeredWith: T | undefined = undefined;
    private _triggered = false;

    trigger(data?: T): void {
        if (this._triggered) {
            return;
        }

        this._triggeredWith = data;
        this._triggered = true;

        super.trigger(data);
    }

    triggerAsync(data?: T): Promise<Error[]> {
        if (this._triggered) {
            return Promise.resolve([] as Error[]);
        }

        this._triggeredWith = data;
        this._triggered = true;

        return super.triggerAsync(data);
    }

    on(handler: EventHandler<T>): () => void {
        if (this._triggered) {
            catchPromise(
                handler(this._triggeredWith),
            );
            // do not skip adding to handlers in case the event will be reset
        }

        return super.on(handler);
    }

    /** Allows this event to be triggered again and existing subscribers to receive it */
    reset = () => {
        this._triggered = false;
        this._triggeredWith = undefined;
    };
}
