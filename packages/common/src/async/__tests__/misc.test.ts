import { random } from '../../math/calc.js';
import { chainPromises } from '../misc.js';
import { setTimeoutAsync } from '../timeout.js';

describe('async/misc', () => {
    it('chainPromises', async () => {
        const results: number[] = [];

        const factory = (index: number) => async () => {
            await setTimeoutAsync(random(1, 10));
            results.push(index);
        };

        const items = Array.from({ length: 5 }).map((_, i) => i + 1);
        const promises = items.map(factory);

        await chainPromises(...promises);

        expect(results).toEqual(items);
    });
});
