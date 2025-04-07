import { setTimeoutAsync } from '../async/timeout.js';
import type { IDisposable } from '../functions/disposer.js';
import { Event, type IEvent } from './event.js';

export interface ITimeout extends IDisposable {
    /** Fired when the timeout has elapsed. Passes actual elapsed milliseconds. */
    readonly event: IEvent<number>;
    /** Whether the timeout is running */
    readonly isRunning: boolean;

    /** Starts the timeout */
    start(delay: number, callback?: () => void): Promise<number>;
    /** Stops the timeout, event will not be triggered. */
    stop(): void;
}

/**
 * Simple one-off `setTimeout` wrapper/abstraction.
 * Handle timeout via event, callback or Promise.
 */
export class Timeout implements ITimeout {

    private _cancelCb: null | (() => void) = null;
    private readonly _event: Event<number> = new Event<number>();

    public get event() { return this._event.expose(); }
    public get isRunning() { return this._cancelCb !== null; }

    async start(delay: number, callback?: () => void) {
        this.stop();

        const startTime = Date.now();

        try {
            await setTimeoutAsync(delay, cancelCb => {
                this._cancelCb = cancelCb;
            });
        } finally {
            this._cancelCb = null;
        }

        const elapsed = Date.now() - startTime;
        this._event.trigger(elapsed);

        if (callback) {
            try {
                callback();
            } catch (_err) {
                // ignore
            }
        }

        return elapsed;
    }

    stop() {
        if (this._cancelCb) {
            this._cancelCb();
            this._cancelCb = null;
        }
    }

    dispose(): void {
        this.stop();
    }
}
