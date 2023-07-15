import { observable, computed, makeObservable, reaction, action } from 'mobx';
import { createLazy } from '@zajno/common/lazy/light';
import { FlagModel, ILabeledFlagModel } from './FlagModel';
import { ValidatableModel } from './Validatable';
import type { IValueModel, IResetableModel } from '@zajno/common/models/types';
import { withLabel } from '@zajno/common/models/wrappers';
import { Getter } from '@zajno/common/types';

export class Select<T = any> extends ValidatableModel<T> implements IValueModel<string>, IResetableModel {
    private _index: number = undefined;

    private readonly _items: Getter<readonly T[]>;

    private _indexLocked = false;
    private _initialIndex: number = null;

    private readonly _flags = createLazy(() => this.createFlags());

    public readonly opened = new FlagModel();

    constructor(
        items: Getter<readonly T[]>,
        private readonly _accessor: (item: T) => string,
        initialIndex: number = 0,
    ) {
        super();

        this._items = items;
        this._initialIndex = initialIndex;
        this._index = initialIndex;

        makeObservable<Select<T>, '_index' | '_items'>(this, {
            _index: observable,
            _items: observable.ref,
            values: computed,
            items: computed,
            setIndex: action,
        });
    }

    protected get valueToValidate() { return this.selectedItem; }

    // @computed
    get values(): readonly string[] {
        return this.items.map(i => this._accessor(i));
    }

    get flags() {
        return this._flags.value;
    }

    // @computed
    get items(): readonly T[] {
        return Getter.getValue(this._items);
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
        const items = this.items;
        return items.length ? items[this._index] : null;
    }

    set selectedItem(item: T) {
        const index = this.items.indexOf(item);
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

    public reset = () => {
        super.reset();
        this.index = this._initialIndex;
    };

    private createFlags() {
        const flags: ReadonlyArray<ILabeledFlagModel> = this.items
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
