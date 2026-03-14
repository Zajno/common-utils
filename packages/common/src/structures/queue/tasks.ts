import type { ILogger } from '../../logger/index.js';

type Factory<T> = () => Promise<T>;

type QueueItem<T> = {
    factory: Factory<T>;
    finish?: (res: Promise<T>) => Promise<T>;
    name?: string;
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
    private readonly _delayedTimers = new Set<ReturnType<typeof setTimeout>>();

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
                finish: undefined,
                name,
            };

            const waitPromise = new Promise<T>((resolve, reject) => {
                item.finish = async (res) => {
                    try {
                        const rr = await res;
                        resolve(rr);
                        return rr;
                    } catch (err) {
                        reject(err as Error);
                        throw err;
                    }
                };
            });

            this._items.push(item);
            return waitPromise;
        }

        return this._runFactory(factory, name);
    }

    /** Enqueue a task to run after `delay` ms. Returns a cancel function. */
    public enqueueDelayed(factory: Factory<T>, delay: number, name?: string): () => void {
        const timer = setTimeout(() => {
            this._delayedTimers.delete(timer);
            this.enqueue(factory, name);
        }, delay);
        this._delayedTimers.add(timer);

        return () => {
            clearTimeout(timer);
            this._delayedTimers.delete(timer);
        };
    }

    /** Remove all pending tasks from the queue. Does not cancel running tasks. Also cancels all delayed enqueues. */
    public clear(): void {
        this._items.length = 0;
        for (const timer of this._delayedTimers) {
            clearTimeout(timer);
        }
        this._delayedTimers.clear();
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
        if (!next || !next.finish || !next.factory) {
            return;
        }

        await next.finish(this._runFactory(next.factory, next.name));
    };

}
