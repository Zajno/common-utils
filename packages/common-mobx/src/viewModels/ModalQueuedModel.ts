import { ModalViewModel } from './ModalModel.js';

export class ModalQueuedViewModel<T> extends ModalViewModel<T> {
    private _queue: T[] = [];

    private _doOpen(data: T) {
        this._queue.push(data);

        if (!this.isOpened) {
            super.open(this._queue[0]);
        }
    }

    private _doClose() {
        if (!this._queue.length) {
            super.close();
            return;
        }

        this._queue.shift();
        super.close();
        super.open(this._queue[0]);
    }

    open(data: T, onOpenCb?: () => Promise<void>): void {
        if (onOpenCb) {
            onOpenCb().then(() => this._doOpen(data));
            return;
        }

        this._doOpen(data);
    }

    close = (onCloseCb?: () => Promise<void>): void => {
        if (onCloseCb) {
            onCloseCb().then(() => this._doClose());
            return;
        }

        this._doClose();
    };
}
