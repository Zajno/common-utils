import * as DateHelpers from '../dates';
import * as MathHelpers from '../math';
import logger, { ILogger } from '../logger';
import { Event } from './event';

export class ProgressTracker {

    private readonly _firstTimestamp = Date.now();
    private _lastTimestamp: number = null;
    private _lastCompleted: number = null;

    private _completed = 0;
    private _total = 0;

    private readonly _deltas: number[] = [];

    private readonly _changed = new Event<{ completed: number, total: number, currentProgress: number, totalElapsedMs: number, totalEstimatedMs: number }>();

    constructor(readonly log: boolean | ILogger = true) { }

    public get changed() { return this._changed.expose(); }

    private get logger() {
        return this.log === true
            ? logger
            : (this.log || null);
    }

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
        const timePerCompleted = completedDelta > 0 ? (elapsedDelta / completedDelta) : 0;

        this._deltas.push(timePerCompleted);
        if (this._deltas.length > 20) {
            this._deltas.shift();
        }

        const currentProgress = Math.floor(completed / (total || 100) * 100);
        const itemsLeft = total - completed;
        const leftProgressTime = itemsLeft * (MathHelpers.arrayAverage(this._deltas, true) || 1000);

        this._lastTimestamp = Date.now();

        const totalElapsedMs = this._lastTimestamp - this._firstTimestamp;

        if (this.log) {
            const totalElapsed = msToString(totalElapsedMs);
            const totalEstimated = msToString(leftProgressTime);

            this.logger.log(`Progress: ${completed}/${total} ${totalElapsed}/${totalEstimated} => ${currentProgress}%`);
        }

        this._changed.trigger({
            completed,
            total,
            currentProgress,
            totalElapsedMs,
            totalEstimatedMs: leftProgressTime,
        });
    }
}

function msToString(this: void, ms: number) {
    const decs = DateHelpers.decomposeMs(ms, 'second', 'minute', 'hour');
    const nf = (n: number) => n.toString().padStart(2, '0');
    return `${nf(decs.hour)}:${nf(decs.minute)}:${nf(decs.second)}`;
}
