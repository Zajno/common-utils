import { MultiSelect } from '../MultiSelectModel';

describe('MultiSelectModel', () => {
    it('consistent', () => {
        expect(() => new MultiSelect(null, null).values).toThrow();
        expect(() => new MultiSelect([1], null).values).toThrow();

        const items = [1, 2, 3];
        const accessor = (i: number) => `_${i}_`;
        const values = items.map(accessor);
        const initialSelected = [1];

        const vm = new MultiSelect(items, accessor, ...initialSelected);

        expect(vm.items).toStrictEqual(items);
        expect(vm.values).toStrictEqual(values);
        expect(vm.selectedIndexes).toStrictEqual(initialSelected);

        initialSelected.forEach(index => {
            expect(vm.isIndexSelected(index)).toBe(initialSelected.includes(index));
        });
    });
});
