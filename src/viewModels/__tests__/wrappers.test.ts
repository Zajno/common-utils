import { inject, withLabel } from '../wrappers';
import { NumberModel } from '../NumberModel';
import { FlagModel } from '../FlagModel';

describe('labeled', () => {
    test('consistensy', () => {

        const initial = 0;
        const num = new NumberModel(initial);

        expect(num.value).toBe(initial);

        const label = { str: '123' };
        const labeledNum = withLabel(new NumberModel(), () => label);

        expect(labeledNum.label.str).toEqual(label.str);

        label.str = 'abc';
        expect(labeledNum.label).toStrictEqual(label);
    });
});

describe('inject', () => {
    test('consistency/number', () => {
        const num = new NumberModel();

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
        const flag = new FlagModel();

        flag.value = true;
        expect(flag.value).toBe(true);

        inject(flag, { value: false });

        expect(flag.value).toBe(false);

        flag.value = true;
        expect(flag.value).toBe(true);
    });
});
