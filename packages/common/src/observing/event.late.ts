import { catchPromise } from '../functions/safe';
import { Event, EventHandler } from './event';

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
