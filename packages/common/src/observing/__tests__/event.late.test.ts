import { setTimeoutAsync } from '../../async/timeout.js';
import { catchPromise } from '../../functions/safe.js';
import { OneTimeLateEvent } from '../event.late.js';

describe('OneTimeLateEvent', () => {

    it('called only once', () => {
        const e = new OneTimeLateEvent<number>();
        const handler = vi.fn();
        e.on(handler);
        e.trigger(1);
        e.trigger(2);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);
    });

    it('called only once async', async () => {
        const e = new OneTimeLateEvent<number>();
        const handler = vi.fn();
        e.on(handler);
        catchPromise(e.triggerAsync(1));
        catchPromise(e.triggerAsync(2));
        await setTimeoutAsync(100);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);
    });

    it('called immediately for late handler', () => {
        const e = new OneTimeLateEvent<number>();
        e.trigger(1);
        const handler = vi.fn();
        e.on(handler);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);
    });

    it('callable after reset', () => {
        const e = new OneTimeLateEvent<number>();
        e.trigger(1);
        const handler = vi.fn();
        e.on(handler);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);

        handler.mockReset();

        e.reset();
        e.trigger(2);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(2);
    });
});
