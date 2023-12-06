import { setTimeoutAsync } from '@zajno/common/async/timeout';
import { OptimisticModel } from '../OptimisticModel';

describe('OptimisticModel', () => {

    it('stores new value until it is confirmed', async () => {
        let _storedValue: number = 1;
        let _shouldFail = false;
        const _valueSetter = jest.fn(async (v: number) => {
            await setTimeoutAsync(100);
            if (_shouldFail) {
                return false;
            }
            _storedValue = v;
            return true;
        });

        const model = new OptimisticModel(() => _storedValue, _valueSetter);
        model.value = 2;

        expect(model.value).toBe(2);
        expect(model.originalValue).toBe(1);

        await setTimeoutAsync(100);

        expect(model.value).toBe(2);

        _shouldFail = true;

        model.value = 3;

        expect(model.value).toBe(3);
        expect(model.originalValue).toBe(2);

        await setTimeoutAsync(100);

        expect(model.value).toBe(2);
    });

});
