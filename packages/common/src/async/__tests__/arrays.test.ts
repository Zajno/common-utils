import { random } from '../../math/calc.js';
import { everyAsync, forEachAsync, someAsync, mapAsync } from '../arrays.js';
import { setTimeoutAsync } from '../timeout.js';

describe('async/arrays', () => {
    it('someAsync', async () => {
        await expect(someAsync([1, 2, 3], async (v) => {
            return v === 2;
        })).resolves.toBe(true);

        await expect(someAsync([1, 2, 3], async (v) => {
            return v > 5;
        })).resolves.toBe(false);
    });

    it('everyAsync', async () => {
        await expect(everyAsync([1, 2, 3], async (v) => {
            return v < 5;
        })).resolves.toBe(true);

        await expect(everyAsync([1, 2, 3], async (v) => {
            return v > 5;
        })).resolves.toBe(false);
    });

    it('forEachAsync', async () => {
        const arr = [1, 2, 3];
        const results: number[] = [];
        await forEachAsync(arr, async (v) => {
            await setTimeoutAsync(random(1, 10));
            results.push(v);
        });
        expect(results).toEqual(arr);
    });

    it('mapAsync', async () => {
        const arr = [1, 2, 3];
        const results = await mapAsync(arr, async (v) => {
            await setTimeoutAsync(random(1, 10));
            return v * 2;
        });
        expect(results).toEqual([2, 4, 6]);
    });
});
