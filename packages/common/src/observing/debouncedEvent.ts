import { Event } from './event.js';
import { DebounceAction } from '../functions/debounce.js';

export class DebouncedEvent extends Event {

    private readonly _debounce = new DebounceAction(100);

    public setTimeout(timeout: number) {
        this._debounce.timeout = timeout;
        return this;
    }

    public trigger() {
        this._debounce.tryRun(() => super.trigger());
    }

    public triggerAsync(): Promise<Error[]> {
        throw new Error('DebouncedEvent does not support triggerAsync');
    }
}
