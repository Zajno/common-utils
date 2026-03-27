
import { createLazy } from '../light.js';

describe('createLazy (light)', () => {

    it('lazily initializes value on first access', () => {
        const factory = vi.fn(() => 42);
        const lazy = createLazy(factory);

        expect(factory).not.toHaveBeenCalled();
        expect(lazy.hasValue).toBe(false);
        expect(lazy.currentValue).toBeUndefined();

        expect(lazy.value).toBe(42);
        expect(factory).toHaveBeenCalledTimes(1);
        expect(lazy.hasValue).toBe(true);
        expect(lazy.currentValue).toBe(42);
    });

    it('caches value after first access', () => {
        const factory = vi.fn(() => ({ data: 'test' }));
        const lazy = createLazy(factory);

        const first = lazy.value;
        const second = lazy.value;

        expect(first).toBe(second); // same reference
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('error stores raw error on factory throw', () => {
        const err = new Error('factory failed');
        const lazy = createLazy(() => { throw err; });

        expect(lazy.error).toBeNull();
        expect(lazy.hasValue).toBe(false);

        expect(() => lazy.value).toThrow(err);

        expect(lazy.error).toBe(err); // raw error preserved
        expect(lazy.hasValue).toBe(false);
    });

    it('errorMessage returns formatted string', () => {
        const lazy = createLazy(() => { throw new Error('oops'); });

        expect(lazy.errorMessage).toBeNull();

        expect(() => lazy.value).toThrow();

        expect(lazy.errorMessage).toBe('oops');
    });

    it('errorMessage handles Error with custom message', () => {
        const lazy = createLazy(() => { throw new TypeError('type mismatch'); });

        expect(() => lazy.value).toThrow();

        expect(lazy.error).toBeInstanceOf(TypeError);
        expect(lazy.errorMessage).toBe('type mismatch');
    });

    it('reset clears value and error', () => {
        const factory = vi.fn(() => 'value');
        const lazy = createLazy(factory);

        void lazy.value;
        expect(lazy.hasValue).toBe(true);

        lazy.reset();

        expect(lazy.hasValue).toBe(false);
        expect(lazy.currentValue).toBeUndefined();
        expect(lazy.error).toBeNull();
    });

    it('re-initializes after reset', () => {
        let counter = 0;
        const lazy = createLazy(() => ++counter);

        expect(lazy.value).toBe(1);
        expect(lazy.value).toBe(1); // cached

        lazy.reset();

        expect(lazy.value).toBe(2); // re-initialized
    });

    it('dispose delegates to reset', () => {
        const lazy = createLazy(() => 'value');

        void lazy.value;
        expect(lazy.hasValue).toBe(true);

        lazy.dispose();

        expect(lazy.hasValue).toBe(false);
        expect(lazy.currentValue).toBeUndefined();
    });

    it('clears error on successful re-access after reset', () => {
        let shouldFail = true;
        const lazy = createLazy(() => {
            if (shouldFail) throw new Error('fail');
            return 'ok';
        });

        expect(() => lazy.value).toThrow();
        expect(lazy.error).toBeInstanceOf(Error);

        shouldFail = false;
        lazy.reset();

        expect(lazy.value).toBe('ok');
        expect(lazy.error).toBeNull();
    });

    it('error is cleared before retry on value access', () => {
        let callCount = 0;
        const lazy = createLazy(() => {
            callCount++;
            if (callCount === 1) throw new Error('first fail');
            return 'success';
        });

        // First access fails
        expect(() => lazy.value).toThrow();
        expect(lazy.error).toBeInstanceOf(Error);

        // Reset and retry
        lazy.reset();
        expect(lazy.error).toBeNull();

        // Second access succeeds
        expect(lazy.value).toBe('success');
        expect(lazy.error).toBeNull();
    });
});
