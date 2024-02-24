import { Lazy } from '../singleton';
import { LazyPromise } from '../promise';
import { setTimeoutAsync } from '../../async/timeout';

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
});

describe('LazyPromise', () => {

    it('simple', async () => {
        const VAL = 'abc';
        const l = new LazyPromise(() => setTimeoutAsync(100).then(() => VAL));

        expect(l.hasValue).toBeFalse();
        expect(l.busy).toBeFalse();

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
        expect(l.busy).toBeFalse();

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

});
