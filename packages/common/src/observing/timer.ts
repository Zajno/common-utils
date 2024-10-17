import { IDisposable } from '../functions/disposer.js';
import { Nullable } from '../types/misc.js';
import { Event, EventHandler, IEvent } from './event.js';

export type TimerState = {
    timer: Timer;
    elapsed: number;
    left: number;
    now: number;
};

export class Timer implements IDisposable, IEvent<TimerState> {
    private readonly _event = new Event<TimerState>();
    private readonly _onFinished = new Event<TimerState>();

    private _now: number = Date.now();

    private _elapsed: number = 0;
    private _left: Nullable<number>;

    private _duration: Nullable<number>;

    private _handle: null | ReturnType<typeof setInterval> = null;

    /**
     * @param interval timer firing interval in milliseconds
     * @param start whether to start the timer immediately. default is `true`
     */
    constructor(readonly interval = 3600 * 1000, start = true) {
        if (start) {
            this.restart();
        }
    }

    /** the timestamp when the timer last fired  */
    get now() { return this._now; }
    /** the duration of the timer in milliseconds. If was not set, `Number.MAX_SAFE_INTEGER` */
    get duration() { return this._duration ?? Number.MAX_SAFE_INTEGER; }
    /** the elapsed milliseconds since the timer started */
    get elapsed() { return this._elapsed; }
    /** left milliseconds for this timer. If duration was not set, `Number.MAX_SAFE_INTEGER` */
    get left() { return this._left ?? Number.MAX_SAFE_INTEGER; }

    /** Fired when the timer has finished by duration, if set */
    get onFinished() { return this._onFinished.expose(); }

    /** Adds duration in milliseconds for the timer so it will auto-stop when elapsed is >= duration */
    withDuration(duration: number) {
        this._duration = duration;
        this._left = duration;
        return this;
    }

    on(handler: EventHandler<TimerState>): () => void {
        return this._event.on(handler);
    }

    off(handler: EventHandler<TimerState>): void {
        return this._event.off(handler);
    }

    /** (Re-)Starts the timer */
    public restart() {
        this.dispose();

        this._elapsed = 0;
        this._now = Date.now();
        this._left = this._duration;

        const startTime = this._now;

        const getState = () => ({
            timer: this,
            elapsed: this._elapsed,
            left: this.left,
            now: this._now,
        });

        const onTick = (firstTime = false) => {
            const now = Date.now();
            this._elapsed = now - startTime;
            this._now = now;

            this._left = this._duration
                ? Math.max(0, this._duration - this._elapsed)
                : null;

            this._event.trigger(getState());

            if (!firstTime && this._left != null && this._left <= 0) {
                this.dispose();
                this._onFinished.trigger(getState());
            }
        };

        // Update _now once an interval
        this._handle = setInterval(() => onTick(), this.interval);
        onTick(true);
    }

    /** Stops the timer but does not clean all counters. */
    public dispose(): void {
        if (this._handle) {
            clearInterval(this._handle);
        }
        this._handle = null;
    }
}
