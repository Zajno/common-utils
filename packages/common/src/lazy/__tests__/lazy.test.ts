import { Lazy } from '../singleton.js';
import { LazyPromise } from '../promise.js';
import { setTimeoutAsync } from '../../async/timeout.js';
import { ExpireTracker } from '../../structures/expire.js';

describe('Lazy', () => {
    it('simple', () => {
        const VAL = 'abc';
        const l = new Lazy(() => VAL);

        expect(l.hasValue).toBeFalse();
        expect(l.value).toBe(VAL);
        expect(l.hasValue).toBeTrue();

        l.reset();
        expect(l.hasValue).toBeFalse();

        l.prewarm();

        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(VAL);
    });

    test('with expire', async () => {
        let incrementor = 0;

        const expire = new ExpireTracker(10);

        const l = new Lazy(() => ++incrementor)
            .withExpire(expire);

        expect(l.hasValue).toBeFalse();
        expect(l.value).toBe(incrementor);
        expect(incrementor).toBe(1);
        expect(l.hasValue).toBeTrue();
        expect(expire.isExpired).toBeFalse();
        expect(expire.remainingMs).toBeLessThanOrEqual(10);

        await setTimeoutAsync(11);

        expect(expire.isExpired).toBeTrue();
        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(incrementor);
        expect(incrementor).toBe(2);
    });
});

describe('LazyPromise', () => {

    it('simple', async () => {
        const VAL = 'abc';
        const l = new LazyPromise(() => setTimeoutAsync(100).then(() => VAL));

        expect(l.hasValue).toBeFalse();
        expect(l.busy).toBeNull();

        expect(l.value).toBeUndefined();
        expect(l.busy).toBeTrue();

        await expect(l.promise).resolves.not.toThrow();

        expect(l.hasValue).toBeTrue();
        expect(l.busy).toBeFalse();
        expect(l.value).toBe(VAL);

        l.dispose();
        expect(l.hasValue).toBeFalse();
    });

    it('setInstance', async () => {
        const VAL = 'abc1';
        const l = new LazyPromise(() => setTimeoutAsync(100).then(() => VAL));

        expect(l.hasValue).toBeFalse();
        expect(l.busy).toBeNull();

        expect(l.value).toBeUndefined();
        expect(l.busy).toBeTrue();

        // loading started when accessed `value` above
        const p = l.promise;

        const VAL2 = 'abc2';
        l.setInstance(VAL2);

        // both old promise and new value should be resolved to the new value
        await expect(p).resolves.toBe(VAL2);
        await expect(l.promise).resolves.toBe(VAL2);

        // after all loading
        const VAL3 = 'abc3';
        l.setInstance(VAL3);
        await expect(l.promise).resolves.toBe(VAL3);
    });

    test('with expire', async () => {
        let incrementor = 0;

        const expire = new ExpireTracker(10);

        const l = new LazyPromise(() => setTimeoutAsync(10).then(() => ++incrementor))
            .withExpire(expire);

        expect(l.hasValue).toBeFalse();
        expect(l.busy).toBeFalsy();

        expect(l.value).toBeUndefined();
        expect(l.busy).toBeTrue();

        const next = incrementor + 1;
        await expect(l.promise).resolves.toBe(next);
        expect(incrementor).toBe(next);

        expect(l.hasValue).toBeTrue();
        expect(l.busy).toBeFalse();
        expect(l.value).toBe(1);
        expect(expire.isExpired).toBeFalse();
        expect(expire.remainingMs).toBeLessThanOrEqual(10);

        await setTimeoutAsync(11);

        expect(expire.isExpired).toBeTrue();
        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(1); // still the same value

        await expect(l.promise).resolves.toBe(2);
        expect(incrementor).toBe(2);
        expect(expire.isExpired).toBeFalse();

        expire.expire();
        expect(expire.isExpired).toBeTrue();
        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(2); // still the same value
        await expect(l.promise).resolves.toBe(3);
        expect(incrementor).toBe(3);
        expect(expire.isExpired).toBeFalse();
        expect(l.value).toBe(3);
    });
});
