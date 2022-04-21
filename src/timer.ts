import { IDisposable } from './disposer';
import { Event, EventHandler, IEvent } from './event';

export class Timer implements IDisposable, IEvent<number> {
    private readonly _event = new Event<number>();

    private _now: number = Date.now();
    private _handle = null;

    constructor(readonly interval = 3600 * 1000) {
        this.restart();
    }

    get now() {
        return this._now;
    }

    on(handler: EventHandler<number>): () => void {
        return this._event.on(handler);
    }

    off(handler: EventHandler<number>): void {
        return this._event.off(handler);
    }

    public restart() {
        this.dispose();

        // Update _now once an hour
        this._handle = setInterval(() => {
            this._now = Date.now();
            this._event.trigger(this._now);
        }, this.interval);
    }

    public dispose(): void {
        clearInterval(this._handle);
        this._handle = null;
    }
}
