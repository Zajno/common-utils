import * as Deep from '../types/deep';

describe('Deep Types', () => {

    it('Readonly vs Mutable', () => {

        try {
            type SomeType = { arr: { n: number }[], str: string, fn: () => any, };
            type SomeTypeDeepReadonly = Deep.DeepReadonly<SomeType>;

            const a: SomeTypeDeepReadonly = { arr: [{ n: 1 }, { n: 2 }, { n: 3 }], str: '123', fn: () => { /* no-op */ } };

            // below code is expected to throw a TS errors
            // Expecting ts-jest compiles TS to catch type erorrs

            // @ts-expect-error
            a.arr.sort();
            // @ts-expect-error
            a.arr[0].n = 2;

            const clone = <T>(obj: T): Deep.DeepMutable<T> => JSON.parse(JSON.stringify(obj));

            const b = clone(a);

            // here's just a follow up checking that b is mutable
            b.arr.sort();
            b.arr[0].n = 2;

            // here explicitly expecting that DeepMutable<DeepReadonly<T>> === T
            const c: SomeType = b;
            c.str = '321';
        } catch (err) {
            // supress JS runtime errors if any
        }

        // dummy test to check that TS types usage above are correct
        expect(true).toBeTrue();
    });

    it('Readonly assignable to ReadonlyPartial', () => {

        try {
            const fn = <T>(_obj: Deep.DeepReadonlyPartial<T>): void => { /* no-op */ };

            const a: Deep.DeepReadonly<{ a: string }> = { a: '123' };
            fn(a);

        } catch (err) {
            // supress JS runtime errors if any
        }

        // dummy test to check that TS types usage above are correct
        expect(true).toBeTrue();
    });
});
