import { action, computed, makeObservable, observable, reaction } from 'mobx';
import { createLazy } from '@zajno/common/lazy/light';
import type { IValueModel, ICountableModel, IResetableModel } from '@zajno/common/models/types';
import { arraysCompareDistinct } from '@zajno/common/math';
import { FlagModel, ILabeledFlagModel } from './FlagModel';
import { ValidatableModel } from './Validatable';
import { withLabel } from '@zajno/common/models/wrappers';

export class MultiSelect<T = any> extends ValidatableModel<ReadonlyArray<T>> implements IValueModel<readonly string[]>, IResetableModel, ICountableModel {

    // @observable
    private readonly _indexes = new Set<number>();

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
        this._initial = selected;
        this.setInitialIndexes();

        makeObservable<MultiSelect<T>, '_indexes'>(this, {
            '_indexes': observable,
            selectedIndexes: computed,
            values: computed,
            selectedItems: computed,
            selectedValues: computed,
            isDefault: computed,
            selectItems: action,
            selectValues: action,
            setIndexSelected: action,
        });
    }

    // @computed
    get selectedIndexes(): ReadonlyArray<number> { return Array.from(this._indexes); }

    get items(): ReadonlyArray<T> { return this._items; }

    get flags() { return this._flags.value; }

    // @computed
    get values(): ReadonlyArray<string> {
        return this._items.map(i => this._accessor(i));
    }

    // @computed
    get selectedItems(): ReadonlyArray<T> {
        return this.selectedIndexes.map(i => this._items[i]);
    }

    // @computed
    get selectedValues(): ReadonlyArray<string> {
        const values = this.values;
        return this.selectedIndexes.map(i => values[i]);
    }

    get value() { return this.selectedValues; }
    set value(v: readonly string[]) { this.selectValues(v); }

    isIndexSelected(index: number) { return this._indexes.has(index); }
    isValueSelected(value: string) { return this.selectedValues.includes(value); }

    get count() { return this._items.length; }
    get selectedCount() { return this._indexes.size; }
    get isEmpty() { return this.selectedCount === 0; }

    // @computed
    get isDefault() { return arraysCompareDistinct(this.selectedIndexes, this._initial)?.diff === 0; }

    protected get valueToValidate() { return this.selectedItems; }

    setItemSelected = (item: T, selected: boolean) => {
        const i = this.items.indexOf(item);
        if (i >= 0) {
            this.setIndexSelected(i, selected);
        }
    };

    selectItem = (item: T) => this.setItemSelected(item, true);
    deSelectItem = (item: T) => this.setItemSelected(item, false);

    // @action
    selectItems = (items: readonly T[]) => {
        items.forEach(this.selectItem);
    };

    setValueSelected = (value: string, selected: boolean) => {
        const i = this.values.indexOf(value);
        if (i >= 0) {
            this.setIndexSelected(i, selected);
        }
    };

    selectValue = (value: string) => this.setValueSelected(value, true);
    deSelectValue = (value: string) => this.setValueSelected(value, false);

    // @action
    selectValues = (values: readonly string[]) => {
        values.forEach(this.selectValue);
    };

    // @action
    setIndexSelected = (index: number, selected: boolean) => {
        if (this._indexesLocked) {
            return;
        }

        if (selected) {
            this._indexes.add(index);
        } else {
            this._indexes.delete(index);
        }

        if (this._validateOnChange) {
            this.validate();
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

    selectIndex = (index: number) => this.setIndexSelected(index, true);
    deSelectIndex = (index: number) => this.setIndexSelected(index, false);

    reset = () => {
        super.reset();
        this.setInitialIndexes();
    };

    private setInitialIndexes() {
        this._indexes.clear();
        this._initial.forEach(i => this._indexes.add(i));

        if (this._flags.hasValue) {
            this._flags.value.forEach((flag, index) => flag.value = this._indexes.has(index));
        }
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

    constructor(items: ReadonlyArray<T>, ...selected: number[]) {
        super(items, v => v, ...selected);
    }
}
