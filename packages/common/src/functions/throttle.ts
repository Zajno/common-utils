import { type ManualPromise, createManualPromise } from '../async/manualPromise.js';
import { Loggable, type ILogger } from '../logger/index.js';
import { random } from '../math/index.js';
import { Getter } from '../types/getter.js';
import { catchPromise } from './safe.js';

type Callback<T> = () => (T | Promise<T>);

/** Runs a callback after a timeout, ignoring all consecutive calls until the first is processed.  */
export class ThrottleAction<T = any> extends Loggable {

    private _timeoutRef: ReturnType<typeof setTimeout> | null = null;
    private _postponedCb: Callback<T> | null = null;
    private _locked: number | false = false;

    /**
     * In case previous action has started processing but not finished yet, and the following one is going to start,
     * this flag allows to run the second in parallel.
      */
    private _allowParallelRuns = false;

    private _currentRun: ManualPromise<T | undefined> | null = null;

    constructor(public timeout = 1000) {
        super();
    }

    public useParallelRuns() {
        this._allowParallelRuns = true;
        return this;
    }

    clear() {
        if (this._timeoutRef) {
            clearTimeout(this._timeoutRef);
        }
        this._timeoutRef = null;
        this._postponedCb = null;
    }

    tryRun(cb: () => T | Promise<T>, restartTimeout = false): Promise<T | undefined> {
        if (!this._timeoutRef) { // start new timeout
            if (!this._currentRun) {
                this._currentRun = createManualPromise<T | undefined>();
            }

            const result = this._currentRun.promise;

            this._postponedCb = cb;
            this._timeoutRef = setTimeout(() => catchPromise(this.forceRun()), this.timeout);

            return result;
        }

        if (restartTimeout) {
            this.clear();
            return this.tryRun(cb, false);
        }

        return this.getPromise();
    }

    forceRun = async () => {
        const cb = this._postponedCb;
        const p = this._currentRun;
        this._currentRun = null;

        this.clear();

        if (!this._allowParallelRuns && this._locked) {
            // This happening when the previous call is still running, while the new one has finished its timeout and is willing to run.
            // This is probably OK since the running call should cover the current one.
            // TODO Maybe just don't start timeout if the lock is set?
            // The reason for not doing that 👆 is there's still a valid case when previous is still working but it's legit to start a new one (e.g. some state has changed already)
            this.logger?.warn('[ThrottleAction] THROTTLE LOCKED, but another call is forced. Skipping since the behavior is undefined.');
        } else if (cb) {
            let result: T | undefined = undefined;
            const lockId = random(1, 1_000_000);
            try {
                this._locked = lockId;
                result = await cb();
                p?.resolve(result);
                return result;
            } catch (err) {
                p?.reject(err as Error);
                return undefined;
            } finally {
                if (this._locked === lockId) {
                    this._locked = false;
                }
            }
        }
    };

    getPromise() {
        return this._currentRun?.promise || Promise.resolve(undefined);
    }
}

type ProcessorResult<T> = { result: T | undefined, index: number };

export class ThrottleProcessor<TSubject, TResult = any> {

    private readonly _queue: TSubject[] = [];
    private readonly _action: ThrottleAction<TResult | undefined>;

    private _promise: ManualPromise<TResult> | null = null;

    constructor(private readonly process: (objs: TSubject[]) => Promise<TResult>, timeout = 1000) {
        if (!process) {
            throw new Error('Arg0 expected: process');
        }

        this._action = new ThrottleAction(timeout)
            .useParallelRuns();
    }

    public setLogger(logger: Getter<ILogger>) {
        this._action.setLogger(logger);
        return this;
    }

    async push(data: TSubject): Promise<ProcessorResult<TResult>> {
        const index = this._queue.push(data) - 1;

        const res = await this._action.tryRun(this._process, true);

        return {
            result: res,
            index,
        };
    }

    private _process = async () => {
        if (!this._queue.length) {
            return;
        }

        const objs = this._queue.slice();
        this._queue.length = 0;

        return this.process(objs);
    };

    clear() {
        this._action.clear();
        this._promise?.resolve(undefined as TResult);
        this._promise = null;
    }
}
