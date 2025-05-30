import { ModalViewModel } from './ModalModel.js';

export class ModalQueuedViewModel<T> extends ModalViewModel<T> {
    private _queue: T[] = [];

    open(data: T): void {
        this._queue.push(data);

        if (!this.isOpened) {
            super.open(this._queue[0]);
        }
    }

    close = (): void => {
        if (!this._queue.length) {
          super.close();
          return;
        }

        this._queue.shift();
        super.close();
        super.open(this._queue[0]);
    };
}
