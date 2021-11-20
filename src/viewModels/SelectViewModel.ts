import { createLazy } from '../lazy.light';
import { observable, computed, makeObservable, reaction, action } from 'mobx';
import { FlagModel } from './FlagModel';
import { ILabeledFlagModel, LabeledFlagModel } from './LabeledFlagModel';

export class Select<T = any> {
    @observable
    private _index: number = undefined;

    @observable
    public error: boolean = undefined;

    private readonly _opened = new FlagModel();
    private _indexLocked = false;

    private readonly _flags = createLazy(() => this.createFlags());

    constructor(
        private readonly _items: readonly T[],
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

    get flags(): ReadonlyArray<ILabeledFlagModel> {
        return this._flags.value;
    }

    get open() {
        return this._opened.value;
    }

    set open(value: boolean) {
        this._opened.value = value;
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

    get index() {
        return this._index;
    }

    set index(val: number) {
        if (this._indexLocked) {
            return;
        }

        this._index = val;

        // update all flags to be properly selected
        try {
            this._indexLocked = true;

            if (this._flags.hasValue) {
                this._flags.value.forEach((f, i) => f.value = (i === this._index));
            }
        } finally {
            this._indexLocked = false;
        }
    }

    @action
    reset = () => {
        this.index = 0;
    };

    private createFlags() {
        const flags = this._items.map(i => new LabeledFlagModel(() => this._accessor(i)));
        flags.forEach((f, i) => f.value = i === this.index);

        // react on every flag is changed directly
        flags.forEach((f, index) => {
            reaction(() => f.value, isSelected => {
                if (isSelected) {
                    this.index = index;
                }
            });
        });
        return flags;
    }
}

export class SelectString<T extends string = string> extends Select<T> {
    constructor(items: readonly T[], initialIndex: number = 0) {
        super(items, v => v, initialIndex);
    }
}
