import { createLogger, ILogger } from '../logger';
import { Event } from '../event';

export type QueueItem = () => void | Promise<void>;

type Queue = QueueItem[];

export class ParallelQueue {

    private readonly _queues: Record<number, Queue> = { };

    private _inProgress: boolean = null;
    private _currentIndex = 0;
    private _maxIndex = 0;

    private _logger: ILogger = null;

    private readonly _beforePriorityRun = new Event<number>();
    private readonly _afterPriorityRun = new Event<number>();

    public get currentPriority() { return this._currentIndex; }
    public get inProgress() { return this._inProgress; }

    public get beforePriorityRun() { return this._beforePriorityRun.expose(); }
    public get afterPriorityRun() { return this._afterPriorityRun.expose(); }

    public withLogger(name?: string) {
        this._logger = createLogger(`[Queue:${name || '?'}]`);
        return this;
    }

    /** @returns A callback that will try to cancel queued item */
    public enqueue(cb: QueueItem, priority?: number): () => void {
        const p = Math.round(priority || 0);

        // if it's started and the priority has been processing already
        // or it has just finished
        if (this._inProgress && p < this._currentIndex || this._inProgress === false) {
            // just start the loader
            this._executeLoader(cb, p, 1000);
            return () => false;
        }

        // Enqueue for future execution
        const q = this.getQueue(p);
        q.push(cb);
        this._maxIndex = Math.max(this._maxIndex, p);

        // Return callback for removing the item from the queue
        return () => {
            // The processing has started and this queue has been passed already
            if (this._inProgress != null && this._currentIndex >= p) {
                return false;
            }

            // find and remove the item
            const i = q.findIndex(qi => qi === cb);
            if (i >= 0) {
                q.splice(i, 1);
                // return true if we're sure that the item hasn't been executed yet
                return true;
            }
            return false;
        };
    }

    public async start() {
        if (this._inProgress) {
            return undefined;
        }

        this._inProgress = true;
        try {
            await this.tryStartQueue();
        } catch (err) {
            this._logger?.warn('Failed to process queue:', err);
            return false;
        }

        return true;
    }

    private getQueue(priority: number = 0) {
        let q = this._queues[priority];
        if (!q) {
            q = [];
            this._queues[priority] = q;
        }

        return q;
    }

    private async tryStartQueue() {
        let current: QueueItem[] = null;
        let iterations = 0;

        await this._beforePriorityRun.triggerAsync(this._currentIndex);

        while ((current = this._queues[this._currentIndex])?.length) {
            if (iterations++ > 5) {
                break;
            }

            this._logger?.log('Processing priority =', this._currentIndex, '; count =', current.length);

            const items = current.slice();
            current.length = 0;

            await Promise.all(items.map((loader, index) => this._executeLoader(loader, this._currentIndex, index)));
        }

        if (!current?.length && iterations === 0) {
            this._logger?.log('Skipping priority =', this._currentIndex, '; no items');
        }

        await this._afterPriorityRun.triggerAsync(this._currentIndex);

        const next = this._currentIndex + 1;
        if (next > this._maxIndex) {
            // looks like we've finished!
            this._inProgress = false;
            this._logger?.log('Finished processing at index =', this._currentIndex);
            return;
        }

        ++this._currentIndex;
        await this.tryStartQueue();
    }

    private _executeLoader = async (l: QueueItem, priority: number, index?: number) => {
        try {
            await l();
        } catch (err) {
            this._logger?.warn('Failed to process queue item at priority =', priority, ' at index =', index || '?');
            this._logger?.error(err);
        }
    };
}
