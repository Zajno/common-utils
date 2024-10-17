import { Event, oneTimeSubscription } from '../observing/event.js';
import { OneTimeLateEvent } from '../observing/event.late.js';
import { setTimeoutAsync } from '../async/timeout.js';
import { catchPromise } from '../functions/safe.js';

describe('Event', () => {

    it('calls handler', () => {
        const e = new Event<number>();
        const handler = vi.fn();
        e.on(handler);
        e.trigger(1);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);
    });

    it('unsusbcribes handler', () => {
        const e = new Event<number>();
        const handler = vi.fn();
        const unsubscribe = e.on(handler);
        unsubscribe();
        e.trigger(1);
        expect(handler).not.toHaveBeenCalled();
    });

    it('calls multiple handlers w/ same data, doesn\'t fail if one handler throws', () => {
        const e = new Event<number>();
        const handler1 = vi.fn();
        const handler2 = vi.fn(() => {
            throw new Error('test');
        });
        const handler3 = vi.fn();

        e.trigger();
        e.triggerAsync().catch((_err) => { /* suppress */ });

        expect(e.expose()).toBe(e);

        e.on(handler1);
        e.on(handler2);
        e.on(handler3);
        e.trigger(1);
        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler1).toHaveBeenCalledWith(1);
        expect(handler1).toHaveBeenCalledBefore(handler2);

        expect(handler2).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledWith(1);
        expect(handler2).toHaveBeenCalledBefore(handler3);
        expect(handler2).toHaveBeenCalledAfter(handler1);

        expect(handler3).toHaveBeenCalledTimes(1);
        expect(handler3).toHaveBeenCalledWith(1);
        expect(handler3).toHaveBeenCalledAfter(handler2);
    });

    it('resets handlers', () => {
        const e = new Event<number>();
        const handler1 = vi.fn();
        e.on(handler1);

        e.trigger(1);

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler1).toHaveBeenCalledWith(1);

        handler1.mockReset();
        e.resetHandlers();

        e.trigger(2);

        expect(handler1).not.toHaveBeenCalled();
    });

    it('triggers async handlers', async () => {
        const e = new Event<number>();
        const handler1 = vi.fn();

        e.on(() => {
            throw new Error('test');
        });

        e.on(async (arg) => {
            await setTimeoutAsync(100);
            handler1(arg);
        });

        await e.triggerAsync(123);
        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler1).toHaveBeenCalledWith(123);
    });

    it('oneTimeSubscription', async () => {
        const e = new Event<number>();

        const handler1 = vi.fn(<T>(r: T) => r);
        const promise1 = oneTimeSubscription(e).then(handler1);

        e.trigger(1);
        await expect(promise1).resolves.toBe(1);

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler1).toHaveBeenCalledWith(1);

        const handler2 = vi.fn(<T>(r: T) => r);
        const promise2 = oneTimeSubscription(e, x => (x != null && x > 1)).then(handler2);

        handler1.mockReset();

        e.trigger(1);

        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).not.toHaveBeenCalled();

        e.trigger(2);

        await expect(promise2).resolves.toBe(2);

        expect(handler2).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledWith(2);
    });
});

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
