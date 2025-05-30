import { Event } from './event.js';
import { ThrottleAction } from '../functions/throttle.js';

export class ThrottledEvent extends Event {

    private readonly _throttle = new ThrottleAction(100);

    public setTimeout(timeout: number) {
        this._throttle.timeout = timeout;
        return this;
    }

    public trigger() {
        this._throttle.tryRun(() => super.trigger());
    }

    public triggerAsync(): Promise<Error[]> {
        throw new Error('ThrottledEvent does not support triggerAsync');
    }
}
