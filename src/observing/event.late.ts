import { catchPromise } from '../functions/safe';
import { Event, EventHandler } from './event';

export class OneTimeLateEvent<T = any> extends Event<T> {

    private _triggeredWith: T = undefined;
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
        if (this._triggeredWith) {
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
            return () => { /* no-op */ };
        }

        return super.on(handler);
    }
}
