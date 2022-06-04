import { ValidationErrors } from '../../validation';
import { CommonModel } from '../CommonModel';
import { LoadingModel } from '../LoadingModel';
import { setTimeoutAsync } from '../../async/timeout';
import { SelectString } from '../SelectModel';
import { TextInputVM } from '../TextModel';

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

describe('LoadingModel works', () => {
    const worker = async () => {
        await setTimeoutAsync(100);
        return 100;
    };

    it('basic', async () => {

        const m = new LoadingModel();
        expect(m.value).toBe(false);
        expect(m.isLoading).toBeFalsy();

        const promise = m.useLoading(worker);
        expect(m.isLoading).toBeTruthy();

        await promise;

        expect(m.isLoading).toBeFalsy();
    });

    it('with exclusive', async () => {
        const m = new LoadingModel();

        const first = m.useLoading(worker, true);
        expect(m.isLoading).toBeTruthy();

        const second = m.useLoading(worker, true);
        expect(m.isLoading).toBeTruthy();

        await expect(() => m.useLoading(worker, 'throw')).rejects.toThrow();

        expect(m.isLoading).toBeTruthy();

        await expect(second).resolves.toBe(false);
        await expect(first).resolves.toBe(100);

        expect(m.value).toBe(false);
        expect(m.isLoading).toBeFalsy();
    });
});

describe('Others', () => {
    it('has no mobx errors', async () => {

        await expect((async () => {
            return new SelectString([]);
        })()).resolves.not.toThrow();

        await expect((async () => {
            return new TextInputVM();
        })()).resolves.not.toThrow();

    });
});
