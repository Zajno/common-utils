import { createManualPromise, type ManualPromise } from '../../async/manualPromise.js';
import type { ILogger } from '../../logger/index.js';

type Factory<T> = () => Promise<T>;

type QueueItem<T> = {
    factory: Factory<T>;
    promise: ManualPromise<T>;
    name?: string;
};

export type DelayedTask<T> = {
    /** Promise that resolves with the task result, or rejects if the task throws or is cancelled. */
    readonly promise: Promise<T>;
    /** Cancel the delayed task. If the task hasn't started yet, the promise rejects with a 'Cancelled' error. */
    readonly cancel: () => void;
};

export type TasksQueueOptions = {
    /** Delay in ms to wait after each task before starting the next one. Default: 0 */
    delayBetweenTasks?: number;
    /** Called when a task throws. If provided, the error is NOT propagated to the enqueue() promise. */
    onTaskError?: (error: unknown, name?: string) => void;
};

export class TasksQueue<T> {

    private readonly _items: QueueItem<T>[] = [];
    private _running = 0;
    private _logger: ILogger | null = null;
    private readonly _delayBetweenTasks: number;
    private readonly _onTaskError: ((error: unknown, name?: string) => void) | undefined;
    private readonly _delayedTasks = new Set<DelayedTask<T>>();

    constructor(readonly limit: number, options?: TasksQueueOptions) {
        if (!limit || limit < 0) {
            throw new Error('TasksQueue: limit should be a positive number');
        }
        this._delayBetweenTasks = options?.delayBetweenTasks ?? 0;
        this._onTaskError = options?.onTaskError;
    }

    public get isFull() { return this._running >= this.limit; }
    public get running() { return this._running; }

    /** Number of tasks waiting in the queue (not including currently running) */
    public get pending() { return this._items.length; }

    addLogger(logger: ILogger) {
        this._logger = logger;
        return this;
    }

    public enqueue(factory: Factory<T>, name?: string): Promise<T> {
        if (typeof factory !== 'function') {
            throw new Error('Invalid arg: factory not a function');
        }

        if (this.isFull) {

            const item: QueueItem<T> = {
                factory,
                promise: createManualPromise<T>(),
                name,
            };

            this._items.push(item);
            return item.promise.promise;
        }

        return this._runFactory(factory, name);
    }

    /** Enqueue a task to run after `delay` ms. Returns a promise and a cancel function. */
    public enqueueDelayed(factory: Factory<T>, delay: number, name?: string): DelayedTask<T> {
        const mp = createManualPromise<T>();
        let started = false;

        const timer = setTimeout(() => {
            started = true;
            this._delayedTasks.delete(task);
            this.enqueue(factory, name).then(
                result => mp.resolve(result),
                err => mp.reject(err as Error),
            );
        }, delay);

        const cancel = () => {
            if (!started) {
                clearTimeout(timer);
                this._delayedTasks.delete(task);
                mp.reject(new Error('Cancelled'));
            }
        };

        const task: DelayedTask<T> = { promise: mp.promise, cancel };
        this._delayedTasks.add(task);

        return task;
    }

    /** Remove all pending tasks from the queue. Does not cancel running tasks. Also cancels all delayed enqueues.
     *  Pending enqueue() promises are rejected with a 'TasksQueue cleared' error so callers don't hang indefinitely.
     *  Delayed tasks are cancelled and their promises are rejected with a 'Cancelled' error. */
    public clear(): void {
        const pending = this._items.splice(0);
        if (pending.length > 0) {
            const clearError = new Error('TasksQueue cleared');
            for (const item of pending) {
                item.promise.reject(clearError);
            }
        }
        const delayed = [...this._delayedTasks];
        for (const task of delayed) {
            task.cancel();
        }
        this._delayedTasks.clear();
    }

    private _runFactory = async (factory: Factory<T>, name?: string): Promise<T> => {
        this._running++;
        try {
            const result = await factory();
            return result;
        } catch (err) {
            if (this._onTaskError) {
                this._onTaskError(err, name || factory.name || undefined);
                return undefined as T;
            }
            this._logger?.warn(`Factory "${name || factory.name || '<unknown>'}" thrown. Rethrowing...`);
            throw err;
        } finally {
            this._running--;
            if (this._delayBetweenTasks > 0 && this._items.length > 0) {
                await new Promise<void>(resolve => setTimeout(resolve, this._delayBetweenTasks));
            }
            this._tryRunNext();
        }
    };

    private _tryRunNext = async () => {
        if (!this._items.length || this.isFull) {
            return;
        }

        const next = this._items.shift();
        if (!next || !next.factory || !next.promise) {
            return;
        }

        let result: T;
        try {
            result = await this._runFactory(next.factory, next.name);
            next.promise.resolve(result);
        } catch (err) {
            next.promise.reject(err as Error);
        }
    };

}
