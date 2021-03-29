import { observable, computed, makeObservable } from 'mobx';

export class Select<T = any> {
    @observable
    private _index: number;

    @observable
    private _open: boolean;

    @observable
    private _error: boolean;

    constructor(
        private readonly _items: T[],
        private readonly _accessor: (item: T) => string,
        initialIndex: number = undefined,
    ) {
        makeObservable(this);
        this._index = initialIndex;
    }

    @computed
    get values(): readonly string[] {
        return this._items.map(i => this._accessor(i));
    }

    get open() {
        return this._open;
    }

    set open(value: boolean) {
        this._open = value;
    }

    get error() {
        return this._error;
    }

    set error(value: boolean) {
        this._error = value;
    }

    get items() {
        return this._items;
    }

    get selectedValue() {
        const vs = this.values;
        return vs.length ? vs[this._index] : null;
    }

    set selectedValue(value: string) {
        const index = this.values.indexOf(value);
        if (index >= 0) {
            this.index = index;
        }
    }

    get selectedItem(): T {
        return this._items[this._index];
    }

    set selectedItem(item: T) {
        const index = this._items.indexOf(item);
        if (index >= 0) {
            this.index = index;
        }
    }

    // get and set selected index
    get index() {
        return this._index;
    }

    set index (val: number) {
        this._index = val;
    }

    reset = () => {
        this._index = 0;
    };
}

export class SelectString<T extends string = string> extends Select<T> {
    constructor(items: T[], initialIndex: number = 0) {
        super(items, v => v, initialIndex);
    }
}
