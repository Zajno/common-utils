import { MultiSelect } from '../MultiSelectModel';

describe('MultiSelectModel', () => {
    it('consistent', () => {
        expect(() => new MultiSelect(null, null).values).toThrow();
        expect(() => new MultiSelect([1], null).values).toThrow();

        const items = [1, 2, 3];
        const accessor = (i: number) => `_${i}_`;
        const values = items.map(accessor);
        const initialSelected = [1];
        const selectedValues = [accessor(2)];

        const vm = new MultiSelect(items, accessor, ...initialSelected);

        expect(vm.items).toStrictEqual(items);
        expect(vm.values).toStrictEqual(values);
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
