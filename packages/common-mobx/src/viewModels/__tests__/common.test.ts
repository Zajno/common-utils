import { ValidationErrors } from '@zajno/common/validation/index';
import { setTimeoutAsync } from '@zajno/common/async/timeout';
import { CommonModel } from '../CommonModel';
import { LoadingModel } from '../LoadingModel';
import { SelectString } from '../SelectModel';
import { TextInputVM } from '../TextModel';
import { ValueModel } from '../ValueModel';
import { FlagModel } from '../FlagModel';
import { reaction } from 'mobx';
import { spyModel } from '@zajno/common/models/wrappers';

describe('CommonModel', () => {
    const NotEmptyError = 'should be not empty';

    it('works', async () => {

        let m: CommonModel<string[]> = null;

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

        // skip few frames, auto-validation can take up to 2 frames
        await Promise.resolve();
        await Promise.resolve();
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

    it('with firstInit', async () => {
        const m = new LoadingModel(true);

        expect(m.isLoading).toBeTruthy();

        const first = m.useLoading(worker, true);
        expect(m.isLoading).toBeTruthy();

        await expect(first).resolves.toBe(100);

        expect(m.isLoading).toBeFalsy();
    });

    it('with firstInit after reset', async () => {
        const m = new LoadingModel(true);

        expect(m.isLoading).toBeTruthy();

        m.reset();

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

        await expect((async () => {
            return new ValueModel();
        })()).resolves.not.toThrow();

    });

    describe('ValueModel', () => {
        it('observable', () => {

            const vm = new ValueModel(123);

            const sub = vi.fn();
            const unsub = reaction(() => vm.value, v => sub(v));

            vm.value = 321;
            expect(sub).toHaveBeenCalledWith(321);

            sub.mockClear();

            vm.reset();
            expect(sub).toHaveBeenCalledWith(123);

            unsub();
        });
    });

    describe('FlagModel', () => {
        it('observable', () => {

            const vm = new FlagModel();

            const sub = vi.fn();
            const unsub = reaction(() => vm.value, v => sub(v));

            expect(vm.value).toBe(false);

            vm.value = true;
            expect(sub).toHaveBeenCalledWith(true);

            sub.mockClear();

            vm.reset();
            expect(sub).toHaveBeenCalledWith(false);

            vm.toggle();
            expect(sub).toHaveBeenCalledWith(true);

            vm.setFalse();
            expect(sub).toHaveBeenCalledWith(false);

            vm.setTrue();
            expect(sub).toHaveBeenCalledWith(true);

            expect(vm.isDefault).toBe(false);

            unsub();
        });

        it('extendable', () => {
            class Spy extends FlagModel {

                spy = vi.fn();

                public setValue(value: boolean): void {
                    this.spy(value);
                    super.setValue(value);
                }
            }

            const vm = new Spy();

            vm.value = true;
            expect(vm.spy).toHaveBeenCalledWith(true);

            vm.spy.mockClear();
            vm.reset();
            expect(vm.spy).toHaveBeenCalledWith(false);

            vm.spy.mockClear();
            vm.toggle();
            expect(vm.spy).toHaveBeenCalledWith(true);

            vm.spy.mockClear();
            vm.setFalse();
            expect(vm.spy).toHaveBeenCalledWith(false);

            vm.spy.mockClear();
            vm.setTrue();
            expect(vm.spy).toHaveBeenCalledWith(true);
        });

        it('spyable', () => {
            const spy = vi.fn();
            const getterSpy = vi.fn();

            const vm = new FlagModel();

            spyModel(vm, spy, getterSpy);

            vm.value = true;
            expect(spy).toHaveBeenCalledWith(true);
            expect(getterSpy).toHaveBeenCalledTimes(0);

            spy.mockClear();
            getterSpy.mockClear();
            vm.reset();
            expect(spy).toHaveBeenCalledWith(false);
            expect(getterSpy).toHaveBeenCalledTimes(0);

            spy.mockClear();
            getterSpy.mockClear();
            vm.toggle();
            expect(spy).toHaveBeenCalledWith(true);
            expect(getterSpy).toHaveBeenCalledTimes(1);

            spy.mockClear();
            getterSpy.mockClear();
            expect(vm.setFalse()).toBe(true);
            expect(spy).toHaveBeenCalledWith(false);
            expect(getterSpy).toHaveBeenCalledTimes(1);

            spy.mockClear();
            getterSpy.mockClear();
            expect(vm.setTrue()).toBe(true);
            expect(spy).toHaveBeenCalledWith(true);
            expect(getterSpy).toHaveBeenCalledTimes(1);
        });
    });
});
