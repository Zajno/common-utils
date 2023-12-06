import { reaction } from 'mobx';
import { setTimeoutAsync } from '@zajno/common/async/timeout';

import { LazyObservable, LazyPromiseObservable } from '../observable';

describe('Lazy', () => {

    it('observable', () => {
        const createObj = () => ({ str: 'abc' });
        const l = new LazyObservable(() => createObj());

        const listener = vi.fn();

        const clean = reaction(() => l.value, vv => listener(vv), { fireImmediately: true });

        expect(listener).toHaveBeenCalledWith(createObj());

        listener.mockClear();

        l.reset();

        expect(listener).toHaveBeenCalledWith(createObj());

        clean();
    });
});

describe('LazyPromise', () => {

    it('observable', async () => {
        const VAL = 'abc';
        const l = new LazyPromiseObservable(() => setTimeoutAsync(200).then(() => VAL));

        expect(l.hasValue).toBe(false);
        expect(l.busy).toBe(false);

        expect(l.value).toBeUndefined();
        expect(l.busy).toBe(true);
        expect(l.promise).not.toBeNull();

        const listener = vi.fn().mockImplementation(null);
        const clean = reaction(() => l.value, vv => listener(vv), { fireImmediately: true });

        expect(listener).toHaveBeenCalledWith(undefined);

        await expect(l.promise).resolves.not.toThrow();

        expect(listener).toHaveBeenCalledWith(VAL);

        expect(l.hasValue).toBe(true);
        expect(l.busy).toBe(false);
        expect(l.value).toBe(VAL);

        clean();
    });
});
