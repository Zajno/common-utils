import { reaction } from 'mobx';
import { setTimeoutAsync } from '@zajno/common/async/timeout';

import { LazyObservable, LazyPromiseObservable } from '../observable.js';

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
        expect(l.isLoading).toBeNull();

        expect(l.value).toBeUndefined();
        expect(l.isLoading).toBe(true);
        expect(l.promise).not.toBeNull();

        const listener = vi.fn().mockImplementation(() => { /* no-op */ });
        const clean = reaction(() => l.value, vv => listener(vv), { fireImmediately: true });

        expect(listener).toHaveBeenCalledWith(undefined);

        await expect(l.promise).resolves.not.toThrow();

        expect(listener).toHaveBeenCalledWith(VAL);

        expect(l.hasValue).toBe(true);
        expect(l.isLoading).toBe(false);
        expect(l.value).toBe(VAL);

        clean();
    });

    it('error is observable', async () => {
        let shouldFail = true;
        const l = new LazyPromiseObservable<string>(async () => {
            await setTimeoutAsync(50);
            if (shouldFail) {
                throw new Error('Test error');
            }
            return 'success';
        });

        const errorListener = vi.fn();
        const cleanError = reaction(() => l.error, err => errorListener(err), { fireImmediately: true });

        // Initially no error
        expect(errorListener).toHaveBeenCalledWith(null);
        expect(l.error).toBeNull();

        errorListener.mockClear();

        // Trigger loading
        expect(l.value).toBeUndefined();
        await l.promise;

        // Error should be set and observable
        expect(errorListener).toHaveBeenCalledWith('Test error');
        expect(l.error).toBe('Test error');

        errorListener.mockClear();

        // Refresh successfully
        shouldFail = false;
        await l.refresh();

        // Error should be cleared and observable
        expect(errorListener).toHaveBeenCalledWith(null);
        expect(l.error).toBeNull();
        expect(l.value).toBe('success');

        cleanError();
    });

    it('error observable on refresh', async () => {
        let counter = 0;
        const l = new LazyPromiseObservable<string>(async () => {
            await setTimeoutAsync(50);
            counter++;
            if (counter === 2) {
                throw new Error('Refresh error');
            }
            return `value-${counter}`;
        });

        const errorListener = vi.fn();
        const valueListener = vi.fn();

        const cleanError = reaction(() => l.error, err => errorListener(err));
        const cleanValue = reaction(() => l.value, val => valueListener(val));

        // Initial successful load
        await l.promise;
        expect(l.value).toBe('value-1');
        expect(l.error).toBeNull();
        expect(errorListener).not.toHaveBeenCalled();

        // Refresh with error
        await l.refresh();
        expect(errorListener).toHaveBeenCalledWith('Refresh error');
        expect(l.error).toBe('Refresh error');
        expect(l.value).toBe('value-1'); // keeps old value

        errorListener.mockClear();

        // Refresh successfully after error
        await l.refresh();
        expect(errorListener).toHaveBeenCalledWith(null);
        expect(l.error).toBeNull();
        expect(l.value).toBe('value-3');

        cleanError();
        cleanValue();
    });

    it('error is cleared on reset', async () => {
        const l = new LazyPromiseObservable<string>(async () => {
            await setTimeoutAsync(50);
            throw new Error('Test error');
        });

        const errorListener = vi.fn();
        const cleanError = reaction(() => l.error, err => errorListener(err), { fireImmediately: true });

        expect(errorListener).toHaveBeenCalledWith(null);
        errorListener.mockClear();

        // Trigger error
        await l.promise;
        expect(l.error).toBe('Test error');
        expect(errorListener).toHaveBeenCalledWith('Test error');

        errorListener.mockClear();

        // Reset should clear error
        l.reset();
        expect(l.error).toBeNull();
        expect(errorListener).toHaveBeenCalledWith(null);

        cleanError();
    });
});
