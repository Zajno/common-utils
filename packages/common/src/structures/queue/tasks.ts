import type { ILogger } from '../../logger/index.js';

type Factory<T> = () => Promise<T>;

type QueueItem<T> = {
    factory: Factory<T>;
    finish?: (res: Promise<T>) => Promise<T>;
    name?: string;
};

export class TasksQueue<T> {

    private readonly _items: QueueItem<T>[] = [];
    private _running = 0;
    private _logger: ILogger | null = null;

    constructor(readonly limit: number) {
        if (!limit || limit < 0) {
            throw new Error('TasksQueue: limit should be a positive number');
        }
    }

    public get isFull() { return this._running >= this.limit; }
    public get running() { return this._running; }

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

        return this._runFactory(factory);
    }

    private _runFactory = async (factory: Factory<T>, name?: string): Promise<T> => {
        this._running++;
        try {
            const result = await factory();
            return result;
        } catch (err) {
            this._logger?.warn(`Factory "${name || factory.name || '<unknown>'}" thrown. Rethrowing...`);
            throw err;
        } finally {
            this._running--;
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

        await next.finish(this._runFactory(next.factory));
    };

}
