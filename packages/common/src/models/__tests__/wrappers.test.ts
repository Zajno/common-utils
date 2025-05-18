import { inject, withLabel, mixinLabel, spyModel } from '../wrappers.js';
import { Model } from '../Model.js';
import type { IValueModel, IValueModelReadonly } from '../types.js';

describe('labeled', () => {
    test('consistency', () => {

        const initial = 0;
        const num = new Model(initial);

        expect(num.value).toBe(initial);

        const label = { str: '123' };
        const labeledNum = withLabel(new Model(), () => label);

        expect(labeledNum.label.str).toEqual(label.str);

        label.str = 'abc';
        expect(labeledNum.label).toStrictEqual(label);
    });
});

describe('inject', () => {
    test('consistency/number', () => {
        const num = new Model<number>();

        num.value = 123;
        expect(num.value).toBe(123);

        inject(num, { value: 321 });

        expect(num.value).toBe(321);

        num.value = 123;
        expect(num.value).toBe(123);

        let external: number = 0;
        inject(num, {
            get value() { return external; },
            set value(v) { external = v; },
        });

        expect(num.value).toBe(0);
        num.value = 111;
        expect(num.value).toBe(111);
        expect(external).toBe(111);
    });

    test('consistency/flag', () => {
        const flag = new Model<boolean>();

        flag.value = true;
        expect(flag.value).toBe(true);

        inject(flag, { value: false });

        expect(flag.value).toBe(false);

        flag.value = true;
        expect(flag.value).toBe(true);
    });
});

describe('spyModel', () => {
    it('spies on Model', () => {
        const vm = new Model<number>();

        const spySetter = vi.fn();
        const spyGetter = vi.fn();

        spyModel(vm, spySetter, spyGetter);

        vm.value = 123;
        expect(spySetter).toHaveBeenCalledTimes(1);
        expect(spySetter).toHaveBeenCalledWith(123);

        expect(vm.value).toBe(123);
        expect(spyGetter).toHaveBeenCalledTimes(1);
        expect(spyGetter).toHaveBeenCalledWith(123);
    });

    it('spies on spied Model', () => {
        const vm = new Model<number>();

        const prevSpySetter = vi.fn();
        const prevSpyGetter = vi.fn();

        // dummy spy
        spyModel(vm, prevSpySetter, prevSpyGetter);

        const spySetter = vi.fn();
        const spyGetter = vi.fn();

        spyModel(vm, spySetter, spyGetter);

        vm.value = 123;
        expect(prevSpySetter).toHaveBeenCalledTimes(1);
        expect(prevSpySetter).toHaveBeenCalledWith(123);
        expect(spySetter).toHaveBeenCalledTimes(1);
        expect(spySetter).toHaveBeenCalledWith(123);

        expect(vm.value).toBe(123);
        expect(prevSpyGetter).toHaveBeenCalledTimes(1);
        expect(prevSpyGetter).toHaveBeenCalledWith(123);
        expect(spyGetter).toHaveBeenCalledTimes(1);
        expect(spyGetter).toHaveBeenCalledWith(123);
    });

    it('spies on IValueModel', () => {
        const vm: IValueModel<number> = { value: 0 };

        const spySetter = vi.fn();
        const spyGetter = vi.fn();
        spyModel(vm, spySetter, spyGetter);

        vm.value = 123;
        expect(spySetter).toHaveBeenCalledTimes(1);
        expect(spySetter).toHaveBeenCalledWith(123);

        expect(vm.value).toBe(123);
        expect(spyGetter).toHaveBeenCalledTimes(1);
        expect(spyGetter).toHaveBeenCalledWith(123);
    });

    it('spies on IValueModel (get/set)', () => {
        let _value = 0;
        const vm: IValueModel<number> = { get value() { return _value; }, set value(v) { _value = v; } };

        const spySetter = vi.fn();
        const spyGetter = vi.fn();
        spyModel(vm, spySetter, spyGetter);

        vm.value = 123;
        expect(spySetter).toHaveBeenCalledTimes(1);
        expect(spySetter).toHaveBeenCalledWith(123);

        expect(vm.value).toBe(123);
        expect(spyGetter).toHaveBeenCalledTimes(1);
        expect(spyGetter).toHaveBeenCalledWith(123);

        expect(_value).toBe(123);
    });

    it('spies on IValueModelReadonly (get only)', () => {
        const _value = 123;
        const vm: IValueModelReadonly<number> = { get value() { return _value; } };

        const spySetter = vi.fn();
        const spyGetter = vi.fn();
        spyModel(vm, spySetter, spyGetter);

        expect(vm.value).toBe(123);
        expect(spyGetter).toHaveBeenCalledTimes(1);
        expect(spyGetter).toHaveBeenCalledWith(123);

        expect(_value).toBe(123);
    });
});

describe('labelize', () => {
    test('consistency', async () => {

        const Mixin = mixinLabel(Model<boolean>);

        const factory = () => Promise.resolve(new Mixin());

        await expect(factory()).resolves.not.toThrow();

        let label = '123';
        const vm = new Mixin(() => label, false);
        expect(vm.value).toBe(false);
        expect(vm.label).toBe(label);

        label = '312';
        expect(vm.label).toBe(label);
    });
});
