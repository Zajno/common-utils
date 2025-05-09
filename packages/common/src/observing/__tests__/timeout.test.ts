import { Timeout } from '../timeout.js';

describe('timeout', () => {
    it('positive scenario', async () => {
        const timeout = new Timeout();

        expect(timeout.isRunning).toBe(false);

        const listener = vi.fn();
        timeout.event.on(listener);

        const cb = vi.fn();

        const promise = timeout.start(10, cb);
        expect(timeout.isRunning).toBe(true);
        expect(listener).not.toHaveBeenCalled();
        expect(cb).not.toHaveBeenCalled();
        expect(promise).toBeInstanceOf(Promise);

        await expect(promise).resolves.toBeGreaterThanOrEqual(10);

        expect(listener).toHaveBeenCalled();
        expect(cb).toHaveBeenCalled();
        cb.mockClear();
        listener.mockClear();

        // no callback
        await expect(timeout.start(51)).resolves.toBeGreaterThanOrEqual(50);

        expect(listener).toHaveBeenCalled();
        expect(cb).not.toHaveBeenCalled();
    });

    it('cancels', async () => {
        const timeout = new Timeout();

        const listener = vi.fn();
        timeout.event.on(listener);

        const cb = vi.fn();

        const promise = timeout.start(10, cb);
        timeout.dispose();

        await expect(promise).rejects.toThrow();

        expect(timeout.isRunning).toBe(false);

        expect(listener).not.toHaveBeenCalled();
        expect(cb).not.toHaveBeenCalled();
    });

    it('callback throws', async () => {
        const timeout = new Timeout();

        const cb = vi.fn(() => {
            throw new Error('error');
        });

        await expect(timeout.start(51, cb)).resolves.toBeGreaterThanOrEqual(50);
    });
});
