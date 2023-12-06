import { Lazy } from '../singleton';
import { LazyPromise } from '../promise';
import { setTimeoutAsync } from '../../async/timeout';

import '../../../../common-tests/expect';

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

});
