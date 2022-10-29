import { reaction, toJS } from 'mobx';
import { arrayRepeat } from '@zajno/common/lib/math';
import { MultiSelect, MultiSelectString } from '../MultiSelectModel';

type SetType<T> = { items: T[], selected: number[], accessor: (item: T) => string };

describe('MultiSelectModel', () => {
    it('creates', () => {
        expect(() => new MultiSelect(null, null).values).toThrow();
        expect(() => new MultiSelect([1], null).values).toThrow();
    });

    const sets: SetType<any>[] = [
        { items: [1, 2, 3], selected: [1], accessor: i => `_${i}_` },
        { items: [1, 2, 3], selected: [], accessor: i => `_${i}_` },
        { items: ['a', 'b', 'c'], selected: [2], accessor: i => i },
    ];

    describe('consistent', () => {
        sets.forEach((set, setIndex) => {
            it(`variant ${setIndex + 1}`, () => {
                const items = set.items; // [1, 2, 3];
                const accessor = set.accessor; // (i: number) => `_${i}_`;
                const initialSelected = set.selected; // [1];
                const values = items.map(accessor);
                const selectedValues = initialSelected.map(i => accessor(items[i]));

                const vm = new MultiSelect(items, accessor, ...initialSelected);

                expect(vm.items).toStrictEqual(items);
                expect(vm.values).toStrictEqual(values);
                expect(vm.count).toBe(items.length);
                expect(vm.selectedCount).toBe(initialSelected.length);
                expect(vm.selectedIndexes).toStrictEqual(initialSelected);
                expect(vm.selectedValues).toStrictEqual(selectedValues);

                initialSelected.forEach(index => {
                    expect(vm.isIndexSelected(index)).toBe(initialSelected.includes(index));
                });

                values.forEach((value) => {
                    expect(vm.isValueSelected(value)).toBe(selectedValues.includes(value));
                });
            });
        });

    });

    it('reacts', () => {
        const vm = new MultiSelectString(['a', 'b', 'c']);

        expect(vm.count).toBe(3);
        expect(vm.selectedCount).toBe(0);
        expect(vm.selectedIndexes).toHaveLength(0);

        const mocks = arrayRepeat(() => jest.fn().mockImplementation(null), 5);
        const [
            onSelectedIndexes,
            onSelectedItems,
            onSelectedValues,
            onIsIndexSelected,
            onIsValueSelected,
        ] = mocks;

        const wrapMock = mock => ((a: any) => mock(toJS(a)));

        const expectEmptyCalls = () => {
            expect(onSelectedIndexes).toHaveBeenCalledWith([]);
            expect(onSelectedItems).toHaveBeenCalledWith([]);
            expect(onSelectedValues).toHaveBeenCalledWith([]);
            mocks.forEach(m => m.mockClear());
        };

        reaction(() => vm.selectedIndexes, wrapMock(onSelectedIndexes));
        reaction(() => vm.selectedItems, wrapMock(onSelectedItems));
        reaction(() => vm.selectedValues, wrapMock(onSelectedValues));

        // initially – 'false', so expect only when 'true' should be passed
        reaction(() => vm.isIndexSelected(0), wrapMock(onIsIndexSelected));
        reaction(() => vm.isValueSelected('a'), wrapMock(onIsValueSelected));

        vm.selectIndex(1);

        expect(onSelectedIndexes).toHaveBeenCalledWith([1]);
        expect(onSelectedItems).toHaveBeenCalledWith(['b']);
        expect(onSelectedValues).toHaveBeenCalledWith(['b']);
        expect(onIsIndexSelected).not.toHaveBeenCalled();
        expect(onIsValueSelected).not.toHaveBeenCalled();
        mocks.forEach(m => m.mockClear());

        vm.deSelectIndex(1);
        expect(onIsIndexSelected).not.toHaveBeenCalled();
        expect(onIsValueSelected).not.toHaveBeenCalled();
        expectEmptyCalls();

        vm.selectItem('c');

        expect(onSelectedIndexes).toHaveBeenCalledWith([2]);
        expect(onSelectedItems).toHaveBeenCalledWith(['c']);
        expect(onSelectedValues).toHaveBeenCalledWith(['c']);
        expect(onIsIndexSelected).not.toHaveBeenCalled();
        expect(onIsValueSelected).not.toHaveBeenCalled();
        mocks.forEach(m => m.mockClear());

        vm.deSelectItem('c');
        expect(onIsIndexSelected).not.toHaveBeenCalled();
        expect(onIsValueSelected).not.toHaveBeenCalled();
        expectEmptyCalls();

        vm.selectValue('a');

        expect(onSelectedIndexes).toHaveBeenCalledWith([0]);
        expect(onSelectedItems).toHaveBeenCalledWith(['a']);
        expect(onSelectedValues).toHaveBeenCalledWith(['a']);
        expect(onIsIndexSelected).toHaveBeenCalledWith(true);
        expect(onIsValueSelected).toHaveBeenCalledWith(true);
        mocks.forEach(m => m.mockClear());

        vm.deSelectValue('a');
        expect(onIsIndexSelected).toHaveBeenCalledWith(false);
        expect(onIsValueSelected).toHaveBeenCalledWith(false);
        expectEmptyCalls();

        vm.selectItems(['a', 'b']);

        expect(onSelectedIndexes).toHaveBeenCalledWith([0, 1]);
        expect(onSelectedItems).toHaveBeenCalledWith(['a', 'b']);
        expect(onSelectedValues).toHaveBeenCalledWith(['a', 'b']);
        expect(onIsIndexSelected).toHaveBeenCalledWith(true);
        expect(onIsValueSelected).toHaveBeenCalledWith(true);
        mocks.forEach(m => m.mockClear());

        vm.reset();
        expect(onIsIndexSelected).toHaveBeenCalledWith(false);
        expect(onIsValueSelected).toHaveBeenCalledWith(false);
        expectEmptyCalls();
    });
});
