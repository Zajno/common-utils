import { decomposeMs } from '../dates/decompose.js';
import { type ILogger } from '../logger/index.js';
import { arrayAverage } from '../math/arrays.js';
import { Event } from './event.js';

export class ProgressTracker {

    private readonly _firstTimestamp = Date.now();
    private _lastTimestamp: number | null = null;
    private _lastCompleted: number | null = null;

    private _completed = 0;
    private _total = 0;

    private _currentProgress: number = 0;

    private readonly _deltas: number[] = [];

    private readonly _changed = new Event<{ completed: number, total: number, currentProgress: number, totalElapsedMs: number, totalEstimatedMs: number }>();

    constructor(readonly logger?: ILogger) { }

    public get changed() { return this._changed.expose(); }
    public get total() { return this._total; }
    public get completed() { return this._completed; }
    public get current() { return this._currentProgress; }

    public setTotal(total: number) {
        this._total = total;
        return this;
    }

    public add(amount = 1, restart = false) {
        this._completed = restart ? amount : (this._completed + amount);
        this.track(this._completed, this._total);
    }

    public track(completed: number, total: number) {

        if (!this._lastTimestamp) {
            this._lastTimestamp = this._firstTimestamp;
        }

        const elapsedDelta = Date.now() - this._lastTimestamp;
        const completedDelta = completed - (this._lastCompleted || 0);
        this._lastCompleted = completed;
        this._completed = completed;
        const timePerCompleted = completedDelta > 0 ? (elapsedDelta / completedDelta) : 0;

        this._deltas.push(timePerCompleted);
        if (this._deltas.length > 20) {
            this._deltas.shift();
        }

        this._currentProgress = Math.floor(completed / (total || 100) * 100);
        const itemsLeft = total - completed;
        const leftProgressTime = itemsLeft * (arrayAverage(this._deltas, true) || 1000);

        this._lastTimestamp = Date.now();

        const totalElapsedMs = this._lastTimestamp - this._firstTimestamp;

        if (this.logger) {
            const totalElapsed = msToString(totalElapsedMs);
            const totalEstimated = msToString(leftProgressTime);

            this.logger.log(`Progress: ${completed}/${total} ${totalElapsed}/${totalEstimated} => ${this._currentProgress}%`);
        }

        this._changed.trigger({
            completed,
            total,
            currentProgress: this._currentProgress,
            totalElapsedMs,
            totalEstimatedMs: leftProgressTime,
        });
    }
}

function msToString(this: void, ms: number) {
    const decs = decomposeMs(ms, 'second', 'minute', 'hour');
    const nf = (n: number) => n.toString().padStart(2, '0');
    return `${nf(decs.hour)}:${nf(decs.minute)}:${nf(decs.second)}`;
}
