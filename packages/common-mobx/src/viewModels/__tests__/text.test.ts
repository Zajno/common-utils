import { Text, TextInputVM } from '../TextModel';
import { setTimeoutAsync } from '@zajno/common/async/timeout';
import { ValueModel } from '../ValueModel';
import { ValidationError, ValidationErrors } from '@zajno/common/validation';

describe('TextViewModel', () => {

    describe('Text (readonly)', () => {
        it('creates simple', () => {
            using m1 = new Text(() => 'test');
            expect(m1.value).toBe('test');
        });

        it('observes', async () => {
            const source = new ValueModel('test');

            using m2 = new Text(() => source.value, 100);
            expect(m2.value).toBe('test');

            source.value = 'test2';

            expect(m2.value).toBe('test');

            await setTimeoutAsync(110);

            expect(m2.value).toBe('test2');
        });
    });

    describe('TextInputVM', () => {

        it('creates empty', () => {
            using vm = new TextInputVM();
            expect(vm.value).toBeUndefined();
            expect(vm.isEmpty).toBe(true);
        });

        it('creates static', () => {
            using vm = new TextInputVM({ value: 'test', title: 'title', name: 'name' });
            expect(vm.value).toBe('test');
            expect(vm.title).toBe('title');
            expect(vm.name).toBe('name');

            vm.value = 'test2';
            expect(vm.value).toBe('test2');
            expect(vm.isEmpty).toBe(false);

            expect(vm.focused).toBe(false);
            vm.focused = true;
            expect(vm.focused).toBe(true);
        });

        it('creates dynamic', async () => {
            const source = new ValueModel('test');

            using vm = new TextInputVM({
                value: () => source.value,
                title: () => 'title',
                name: () => 'name',
            });

            expect(vm.value).toBe('test');
            expect(vm.title).toBe('title');
            expect(vm.name).toBe('name');

            source.value = 'test2';
            expect(vm.value).toBe('test2');

            using vmAsync = new TextInputVM({ value: () => source.value, async: true });

            expect(vmAsync.value).toBe('test2');
            source.value = 'test3';
            expect(vmAsync.value).toBe('test2');

            await setTimeoutAsync(100);

            expect(vmAsync.value).toBe('test3');

            vmAsync.value = 'test4'; // should be ignored
            expect(vmAsync.value).toBe('test3');
        });

        it('validates (obj config)', async () => {
            using vm = new TextInputVM({ value: 'test' })
                .setValidationConfig({
                    validator: v => v?.includes('test') ? 0 : 1,
                    errors: { 1: 'error' },
                })
                .validateOnChange();

            expect(vm.isValid).toBe(true);
            expect(vm.error).toBeFalsy();

            expect(vm.validateValue('test')).resolves.toBeFalsy();
            expect(vm.validateValue('abc')).resolves.toBe(1);
            // still no error after validateValue since it's pure
            expect(vm.error).toBeFalsy();

            vm.focused = true;
            expect(vm.error).toBeFalsy();

            vm.value = 'abc';
            await setTimeoutAsync(10);
            expect(vm.error).toBe('error');

            vm.focused = true;
            expect(vm.error).toBeFalsy();
            vm.focused = false;
            await setTimeoutAsync(10);
            expect(vm.error).toBe('error');

            vm.value = 'test';
            await setTimeoutAsync(10);
            expect(vm.error).toBeFalsy();

            // disable validation
            vm.setValidationConfig(undefined);
            expect(vm.error).toBeFalsy();

            await expect(vm.validateValue('test')).resolves.toBeNull();
            await expect(vm.getIsInvalid()).resolves.toBe(false);
        });

        it('validates (fn config)', async () => {
            using vm = new TextInputVM({ value: 'test' })
                .setValidationConfig(v => {
                    if (!v?.includes('test')) {
                        throw new Error('error');
                    }
                })
                .validateOnChange();

            expect(vm.isValid).toBe(true);
            expect(vm.error).toBeFalsy();

            vm.value = 'abc';
            await setTimeoutAsync(10);
            expect(vm.error).toBe('error');

            await expect(vm.getIsInvalid()).resolves.toBe(true);

            vm.focused = true;
            await setTimeoutAsync(10);

            vm.reset();
            expect(vm.value).toBeFalsy();
            expect(vm.focused).toBe(false);
        });

        it('validates (w ValidationError)', async () => {
            using vm = new TextInputVM({ value: 'test' })
                .setValidationConfig(v => {
                    if (!v?.includes('test')) {
                        throw new ValidationError('error', ValidationErrors.Inconsistent);
                    }
                })
                .validateOnChange();

            expect(vm.isValid).toBe(true);
            expect(vm.error).toBeFalsy();

            vm.value = 'abc';
            await setTimeoutAsync(100);
            expect(vm.error).toBe('error');

            await expect(vm.getIsInvalid()).resolves.toBe(true);
        });

    });

});
