import { inject, withLabel, mixinLabel } from '../wrappers';
import { Model } from '../Model';

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

describe('labelize', () => {
    test('consistency', async () => {

        const Mixin = mixinLabel(Model<boolean>);

        await expect((async () => new Mixin())()).resolves.not.toThrow();

        let label = '123';
        const vm = new Mixin(() => label, false);
        expect(vm.value).toBe(false);
        expect(vm.label).toBe(label);

        label = '312';
        expect(vm.label).toBe(label);
    });
});
