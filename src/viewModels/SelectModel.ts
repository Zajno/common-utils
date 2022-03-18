import { createLazy } from '../lazy.light';
import { observable, computed, makeObservable, reaction, action } from 'mobx';
import { FlagModel, ILabeledFlagModel } from './FlagModel';
import { ValidatableModel } from './Validatable';
import { IValueModel } from './types';
import { withLabel } from './wrappers';
import { IResetableModel } from 'viewModels';

export class Select<T = any> extends ValidatableModel<T> implements IValueModel<string>, IResetableModel {
    // @observable
    private _index: number = undefined;

    public readonly opened = new FlagModel();
    private _indexLocked = false;
    private _initialIndex: number = null;

    private readonly _flags = createLazy(() => this.createFlags());

    constructor(
        private readonly _items: readonly T[],
        private readonly _accessor: (item: T) => string,
        initialIndex: number = 0,
    ) {
        super();
        makeObservable<Select<T>, '_index'>(this, {
            '_index': observable,
            values: computed,
            setIndex: action,
        });

        this._initialIndex = initialIndex;
        this._index = initialIndex;
    }

    protected get valueToValidate() { return this.selectedItem; }

    // @computed
    get values(): readonly string[] {
        return this._items.map(i => this._accessor(i));
    }

    get flags() {
        return this._flags.value;
    }

    get items() {
        return this._items;
    }

    get value() { return this.selectedValue; }
    get selectedValue() {
        const vs = this.values;
        return vs.length ? vs[this._index] : null;
    }

    set value(v: string) { this.selectedValue = v; }
    set selectedValue(value: string) {
        const index = this.values.indexOf(value);
        if (index >= 0) {
            this.index = index;
        }
    }

    get selectedItem(): T {
        return this._items.length ? this._items[this._index] : null;
    }

    set selectedItem(item: T) {
        const index = this._items.indexOf(item);
        if (index >= 0) {
            this.index = index;
        }
    }

    get isDefault() { return this._index === this._initialIndex; }

    get index() {
        return this._index;
    }

    set index(val: number) {
       this.setIndex(val);
    }

    // @action
    public setIndex = (val: number) => {
        if (this._indexLocked) {
            return;
        }

        this._index = val;

        if (this._validateOnChange) {
            this.validate();
        }

        // update all flags to be properly selected
        try {
            this._indexLocked = true;

            if (this._flags.hasValue) {
                this._flags.value.forEach((f, i) => f.value = (i === this._index));
            }
        } finally {
            this._indexLocked = false;
        }
    };

    reset = () => {
        super.reset();
        this.index = this._initialIndex;
    };

    private createFlags() {
        const flags: ReadonlyArray<ILabeledFlagModel> = this._items
            .map((item, index) => {
                const flag: ILabeledFlagModel = withLabel(
                    new FlagModel(index === this.index),
                    () => this._accessor(item),
                );

                // react on every flag is changed directly
                reaction(() => flag.value, isSelected => {
                    if (isSelected) {
                        this.index = index;
                    }
                });

                return flag;
            });

        return flags;
    }
}


export class SelectString<T extends string = string> extends Select<T> {
    constructor(items: readonly T[], initialIndex: number = 0) {
        super(items, v => v, initialIndex);
    }
}
