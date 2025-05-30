import { ValueModel } from './ValueModel.js';

export class ModalViewModel<T> {

    protected readonly _data = new ValueModel<T | null>(null, true);

    public get current(): T | null { return this._data.value; }
    public get isOpened(): boolean { return this._data.value != null; }

    public open(data: T) {
        this._data.setValue(data);
    }

    public close(): void {
        this._data.setValue(null);
    };
}
