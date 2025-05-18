import type { AnyObject } from '../index.js';
import * as Deep from '../deep.js';

describe('Deep Types', () => {

    it('Readonly vs Mutable', () => {

        try {
            type SomeType = { arr: { n: number }[], str: string, fn: () => any, };
            type SomeTypeDeepReadonly = Deep.DeepReadonly<SomeType>;

            const a: SomeTypeDeepReadonly = { arr: [{ n: 1 }, { n: 2 }, { n: 3 }], str: '123', fn: () => { /* no-op */ } };

            // below code is expected to throw a TS errors
            // Expecting ts-jest compiles TS to catch type errors

            // @ts-expect-error -- no mutation methods should be allowed
            a.arr.sort();
            // @ts-expect-error -- no direct mutation should be allowed
            a.arr[0].n = 2;

            // example of how to deal with keys of Deep
            // note: key needs more stronger constraints because not all fields can survive the deep readonly transformation
            const keyFn = <T extends AnyObject, TKey extends keyof Deep.DeepReadonly<T>>(obj: Deep.DeepReadonly<T>, key: TKey): Deep.DeepReadonly<T>[TKey] => obj[key];

            const typeConsistency = <T>(_v1: T, _v2: T) => { /* no-op */ };

            typeConsistency<typeof a.arr>(a.arr, keyFn(a, 'arr'));
            typeConsistency<typeof a.str>(a.str, keyFn(a, 'str'));

            const clone = <T>(obj: T) => JSON.parse(JSON.stringify(obj)) as Deep.DeepMutable<T>;

            const b = clone(a);

            // here's just a follow up checking that b is mutable
            b.arr.sort();
            b.arr[0].n = 2;

            // here explicitly expecting that DeepMutable<DeepReadonly<T>> === T
            const c: SomeType = b;
            c.str = '321';

            // DeepReadonly<T>' should be assignable to 'DeepReadonlyPartial<T>'.
            (<T>(_obj: Deep.DeepReadonly<T>): Deep.DeepReadonlyPartial<T> => _obj)(a);

            // T' should be assignable to 'DeepReadonlyPartial<T>'. (here works only via cast)
            (<T>(_obj: T): Deep.DeepReadonlyPartial<T> => _obj as Deep.DeepReadonlyPartial<T>)(a);

        } catch (_err) {
            // suppress JS runtime errors if any
        }

        // dummy test to check that TS types usage above are correct
        expect(true).toBeTruthy();
    });

    it('Readonly assignable to ReadonlyPartial', () => {

        try {
            const fn = <T>(_obj: Deep.DeepReadonlyPartial<T>): void => { /* no-op */ };

            const a: Deep.DeepReadonly<{ a: string }> = { a: '123' };
            fn(a);

        } catch (_err) {
            // suppress JS runtime errors if any
        }

        // dummy test to check that TS types usage above are correct
        expect(true).toBeTruthy();
    });
});
