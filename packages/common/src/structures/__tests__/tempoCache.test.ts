import { TempoCache } from '../tempoCache';
import { setTimeoutAsync } from '../../async/timeout';
import { createLazy } from '../../lazy/light';
import { LazyPromise } from '../../lazy/promise';

describe('TempoCache', () => {
    it('just works', async () => {
        let incrementor = 1;

        const example = new TempoCache(() => Promise.resolve(incrementor++), 99);

        await expect(example.current).resolves.toBe(1);

        await setTimeoutAsync(50);

        // still the same value
        await expect(example.current).resolves.toBe(1);

        await setTimeoutAsync(50);

        // value is expired, incremented
        await expect(example.current).resolves.toBe(2);

        await setTimeoutAsync(50);

        await expect(example.current).resolves.toBe(2);

        await setTimeoutAsync(50);

        await expect(example.current).resolves.toBe(3);
    });

    it('integration with lazy', async () => {
        let incrementor = 0;

        const lazy = createLazy(() => ++incrementor);

        const example = TempoCache.createFromLazy(lazy, 10);

        expect(lazy.hasValue).toBe(false);
        expect(example.current).toBe(incrementor);
        expect(example.isExpired).toBe(false);
        expect(lazy.hasValue).toBe(true);

        await setTimeoutAsync(15);

        expect(example.isExpired).toBe(true);
        expect(lazy.hasValue).toBe(true);

        const prev = incrementor;
        expect(lazy.value).toBe(prev);
        expect(example.current).toBe(prev + 1);
        expect(incrementor).toBe(prev + 1);
    });

    it('integration with lazy promise', async () => {
        let incrementor = 0;

        const lazy = new LazyPromise(() => Promise.resolve(++incrementor));

        const example = TempoCache.createFromLazyPromise(lazy, 20);

        expect(lazy.hasValue).toBe(false);
        await expect(example.current).resolves.toBe(incrementor);
        expect(example.isExpired).toBe(false);
        expect(lazy.hasValue).toBe(true);

        await setTimeoutAsync(20);

        expect(example.isExpired).toBe(true);
        expect(lazy.hasValue).toBe(true);

        const prev = incrementor;
        expect(lazy.value).toBe(prev);
        await expect(example.current).resolves.toBe(prev + 1);
        expect(incrementor).toBe(prev + 1);
    });
});
