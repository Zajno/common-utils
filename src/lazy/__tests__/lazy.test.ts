import { reaction } from 'mobx';
import { setTimeoutAsync } from '@zajno/common/async/timeout';

import { LazyObservable, LazyPromiseObservable } from '../observable';
import { expectAnythingOrNothing } from './helpers';

describe('Lazy', () => {

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


    it('observable', async () => {
        const VAL = 'abc';
        const l = new LazyPromiseObservable(() => setTimeoutAsync(200).then(() => VAL));

        expect(l.hasValue).toBeFalse();
        expect(l.busy).toBeFalse();

        expect(l.value).toBeUndefined();
        expect(l.busy).toBeTrue();
        expect(l.promise).not.toBeNull();

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
