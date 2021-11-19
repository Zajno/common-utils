import { configure } from 'mobx';
import { Select, SelectString } from '../SelectViewModel';

configure({ enforceActions: 'never' });

describe('SelectViewModel', () => {
    it('consistent', () => {
        expect(() => new Select(null, null).values).toThrow();
        expect(() => new Select([1], null).values).toThrow();

        const emptyVm = new Select([], null);
        expect(emptyVm.selectedValue).toBeNull();

        const items = [0, 1, 2];
        const values = ['0!', '1!', '2!'];
        const initialIndex = -1;
        const vm = new Select(items, i => `${i}!`, initialIndex);

        expect(vm.index).toEqual(initialIndex);
        expect(vm.values).toStrictEqual(values);
        expect(vm.items).toStrictEqual(items);

        expect(vm.selectedItem).toBeUndefined();
        expect(vm.selectedValue).toBeUndefined();

        vm.selectedItem = 7;
        expect(vm.index).toBe(initialIndex);

        vm.selectedValue = '123';
        expect(vm.index).toBe(initialIndex);

        vm.open = true;
        expect(vm.open).toBe(true);

        vm.index = 1;
        expect(vm.index).toBe(1);

        expect(vm.flags).toHaveLength(items.length);
        values.forEach((_currentValue, itemIndex) => {
            vm.selectedValue = _currentValue;
            expect(vm.selectedItem).toBe(items[itemIndex]);
            vm.selectedItem = items[itemIndex];
            expect(vm.selectedValue).toBe(_currentValue);
            vm.flags.forEach((f, i) => {
                expect(f.value).toBe(i === itemIndex);
                expect(f.label).toBe(values[i]);
            });
        });

        vm.flags.forEach((f, i) => {
            f.value = true;
            vm.flags.forEach((ff, ii) => {
                expect(ff.value).toBe(i === ii);
            });
            expect(vm.index).toBe(i);
        });

        vm.selectedItem = items[1];
        expect(vm.selectedValue).toBe(values[1]);

        vm.reset();
        expect(vm.index).toBe(0);

        const vmS = new SelectString(values);
        expect(vmS.values).toStrictEqual(values);
    });
});
