import { TempoCache } from '../tempoCache';
import { setTimeoutAsync } from '../../async/timeout';

describe('TempoCache', () => {
    it('just works', async () => {
        let incrementer = 1;

        const example = new TempoCache(() => Promise.resolve(incrementer++), 199);

        expect(await example.current).toBe(1);
        await expect(example.current).resolves.toBe(1);

        await setTimeoutAsync(100);

        await expect(example.current).resolves.toBe(1);

        await setTimeoutAsync(200);

        await expect(example.current).resolves.toBe(2);

        await setTimeoutAsync(100);

        await expect(example.current).resolves.toBe(2);
        await expect(example.current).resolves.toBe(2);

        await setTimeoutAsync(300);

        await expect(example.current).resolves.toBe(3);
        await expect(example.current).resolves.toBe(3);
    });
});
