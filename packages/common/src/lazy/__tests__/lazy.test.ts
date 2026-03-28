import { describe, test } from 'vitest';
import { ExpireTracker } from '../../structures/expire.js';
import { Lazy } from '../lazy.js';

describe('Lazy', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('simple', () => {
        const VAL = 'abc';
        const l = new Lazy(() => VAL);

        expect(l.hasValue).toBeFalse();
        expect(l.value).toBe(VAL);
        expect(l.hasValue).toBeTrue();

        l.reset();
        expect(l.hasValue).toBeFalse();
        expect(l.currentValue).toBeUndefined();
        expect(l.currentValue).toBeUndefined();

        l.prewarm();

        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(VAL);
        expect(l.currentValue).toBe(VAL);
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

        await vi.advanceTimersByTimeAsync(11);

        expect(expire.isExpired).toBeTrue();
        expect(l.hasValue).toBeTrue();
        expect(l.value).toBe(incrementor);
        expect(incrementor).toBe(2);
    });

    test('disposes', () => {
        {
            const l = new Lazy(() => 42);
            expect(l.value).toBe(42);
            expect(l.hasValue).toBeTrue();
            l.dispose();
            expect(l.hasValue).toBeFalse();
        }

        {
            const disposer = vi.fn();
            const l = new Lazy(() => 42)
                .withDisposer(disposer);

            expect(l.value).toBe(42);
            expect(l.hasValue).toBeTrue();

            l.dispose();
            expect(l.hasValue).toBeFalse();
            expect(disposer).toHaveBeenCalledTimes(1);
        }

        {
            const disposer = vi.fn();

            const l = new Lazy(() => ({
                value: 42,
                dispose() {
                    disposer();
                },
            }));

            expect(l.value.value).toBe(42);
            expect(l.hasValue).toBeTrue();

            l.dispose();
            expect(l.hasValue).toBeFalse();
            expect(disposer).toHaveBeenCalledTimes(1);
        }
    });

    test('error handling', () => {
        {
            const l = new Lazy(() => {
                throw new Error('Error object message');
            });

            expect(l.hasValue).toBeFalse();
            expect(l.error).toBeNull();
            expect(l.value).toBeUndefined();
            expect(l.hasValue).toBeFalse();
            expect(l.error).toBeInstanceOf(Error);
            expect((l.error as Error).message).toBe('Error object message');
            expect(l.errorMessage).toBe('Error object message');
        }

        {
            const l = new Lazy(() => {
                throw new Error('Factory error');
            });

            expect(l.value).toBeUndefined();
            expect(l.error).toBeInstanceOf(Error);
            expect(l.errorMessage).toBe('Factory error');
            expect(l.value).toBeUndefined();
            expect(l.errorMessage).toBe('Factory error');
        }

        {
            const l = new Lazy(() => {
                throw new Error('error');
            });

            expect(l.value).toBeUndefined();
            expect(l.error).toBeInstanceOf(Error);
            expect(l.errorMessage).toBe('error');

            l.reset();
            expect(l.error).toBeNull();
            expect(l.errorMessage).toBeNull();
        }
    });
});
