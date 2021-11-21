import { createLazy } from '../lazy.light';
import { action, computed, makeObservable, observable, reaction } from 'mobx';
import { FlagModel, ILabeledFlagModel } from './FlagModel';
import { ValidatableModel } from './Validatable';
import { IValueModel } from './ValuesCollector';
import { withLabel } from './wrappers';

export class MultiSelect<T = any> extends ValidatableModel<ReadonlyArray<T>> implements IValueModel<readonly string[]> {

    @observable
    private _indexes = new Set<number>();

    public readonly opened = new FlagModel();
    private readonly _initial: number[] = null;

    private readonly _flags = createLazy(() => this.createFlags());
    private _indexesLocked = false;

    constructor(
        private readonly _items: readonly T[],
        private readonly _accessor: (item: T) => string,
        ...selected: number[]
    ) {
        super();
        makeObservable(this);
        this._initial = selected;
        this.setInitialIndexes();
    }

    @computed
    get selectedIndexes(): ReadonlyArray<number> { return Array.from(this._indexes); }

    get items(): ReadonlyArray<Readonly<T>> { return this._items; }

    get flags() { return this._flags.value; }

    @computed
    get values(): ReadonlyArray<string> {
        return this._items.map(i => this._accessor(i));
    }

    @computed
    get selectedItems(): ReadonlyArray<Readonly<T>> {
        return this.selectedIndexes.map(i => this._items[i]);
    }

    @computed
    get selectedValues(): ReadonlyArray<string> {
        const values = this.values;
        return this.selectedIndexes.map(i => values[i]);
    }

    get value() { return this.selectedValues; }
    set value(v: readonly string[]) { v.forEach(this.selectValue); }

    getIsIndexSelected(index: number) { return this._indexes.has(index); }

    get isEmpty() { return this._indexes.size === 0; }

    protected get valueToValidate() { return this.selectedItems; }

    setItemSelected = (item: T, selected: boolean) => {
        const i = this.items.indexOf(item);
        if (i >= 0) {
            this.setIndexSelected(i, selected);
        }
    };

    selectItem = (item: T) => this.setItemSelected(item, true);
    deSelectItem = (item: T) => this.setItemSelected(item, false);

    setValueSelected = (value: string, selected: boolean) => {
        const i = this.values.indexOf(value);
        if (i >= 0) {
            this.setIndexSelected(i, selected);
        }
    };

    selectValue = (value: string) => this.setValueSelected(value, true);
    deSelectValue = (value: string) => this.setValueSelected(value, false);

    @action
    setIndexSelected = (index: number, selected: boolean) => {
        if (this._indexesLocked) {
            return;
        }

        if (selected) {
            this._indexes.add(index);
        } else {
            this._indexes.delete(index);
        }

        if (!this._flags.hasValue) {
            return;
        }

        try {
            this._indexesLocked = true;
            this._flags.value[index].value = selected;
        } finally {
            this._indexesLocked = false;
        }
    };

    reset = () => {
        super.reset();
        this.setInitialIndexes();
    };

    private setInitialIndexes() {
        this._indexes.clear();
        this._initial.forEach(i => this._indexes.add(i));
    }

    private createFlags() {
        const flags: ReadonlyArray<ILabeledFlagModel> = this._items
            .map((item, index) => {
                const flag = withLabel(
                    new FlagModel(this._indexes.has(index)),
                    () => this._accessor(item),
                );

                // react on every flag is changed directly
                reaction(() => flag.value, isSelected => {
                    this.setIndexSelected(index, isSelected);
                });
                return flag;
            });
        return flags;
    }
}

export class MultiSelectString<T extends string = string> extends MultiSelect<T> {

    constructor(items: ReadonlyArray<Readonly<T>>, ...selected: number[]) {
        super(items, v => v, ...selected);
    }
}
