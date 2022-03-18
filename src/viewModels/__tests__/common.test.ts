import { ValidationErrors } from '../../validation';
import { CommonModel } from '../CommonModel';
import { LoadingModel } from '../LoadingModel';
import { setTimeoutAsync } from '../../async/timeout';

describe('CommonModel', () => {
    const NotEmptyError = 'should be not empty';

    it('works', async () => {

        let m: CommonModel<string[]>;

        const fn = async () => {
            m = new CommonModel<string[]>(() => [], true)
                .setValidationConfig({
                    validator: (v: readonly any[]) => v.length > 0 ? ValidationErrors.None : ValidationErrors.ShouldBeNonEmpty,
                    errors: {
                        [ValidationErrors.ShouldBeNonEmpty]: NotEmptyError,
                    },
                });
        };

        await expect(fn()).resolves.not.toThrow();
        expect(m).toBeDefined();

        m.value = ['1'];

        expect(m.value).toStrictEqual(['1']);
        const valid1 = await m.validate();
        expect(valid1).toBeTruthy();

        m.reset();

        expect(m.value).toStrictEqual([]);

        const valid2 = await m.validate();
        expect(valid2).toBeFalsy();

        m.reset();
        expect(m.error).toBeFalsy();

        m.validateOnChange(true);
        m.value = [];

        // skip one frame
        await Promise.resolve();

        expect(m.error).toEqual(NotEmptyError);
    });
});

describe('LoadingModel', () => {

    it('works', async () => {

        const m = new LoadingModel();
        expect(m.value).toBe(0);
        expect(m.isLoading).toBeFalsy();

        const worker = async () => {
            await setTimeoutAsync(100);
            return 100;
        };

        const promise = m.useLoading(worker);
        expect(m.isLoading).toBeTruthy();

        await promise;

        expect(m.isLoading).toBeFalsy();
    });
});
