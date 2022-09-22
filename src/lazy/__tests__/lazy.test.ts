import { Lazy } from '../singleton';
import { LazyPromise } from '../promise';
import { setTimeoutAsync } from '../../async/timeout';

import { LazyObservable, LazyPromiseObservable } from '../observable';
import { reaction } from 'mobx';
import { expectAnythingOrNothing } from '../../__tests__/helpers/expect';

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

    it('observable', () => {
        const createObj = () => ({ str: 'abc' });
        const l = new LazyObservable(() => createObj());

        const listener = jest.fn().mockImplementation();

        const clean = reaction(() => l.value, listener, { fireImmediately: true });

        expect(listener).toHaveBeenCalledWith(createObj(), expectAnythingOrNothing, expectAnythingOrNothing);

        listener.mockClear();

        l.reset();

        expect(listener).toHaveBeenCalledWith(createObj(), expectAnythingOrNothing, expectAnythingOrNothing);

        clean();
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

    it('observable', async () => {
        const VAL = 'abc';
        const l = new LazyPromiseObservable(() => setTimeoutAsync(200).then(() => VAL));

        expect(l.hasValue).toBeFalse();
        expect(l.busy).toBeFalse();

        expect(l.value).toBeUndefined();
        expect(l.busy).toBeTrue();

        const listener = jest.fn().mockImplementation();
        const clean = reaction(() => l.value, listener, { fireImmediately: true });

        expect(listener).toHaveBeenCalledWith(undefined, expectAnythingOrNothing, expectAnythingOrNothing);

        await expect(l.promise).resolves.not.toThrow();

        expect(listener).toHaveBeenCalledWith(VAL, expectAnythingOrNothing, expectAnythingOrNothing);

        expect(l.hasValue).toBeTrue();
        expect(l.busy).toBeFalse();
        expect(l.value).toBe(VAL);

        clean();
    });
});
