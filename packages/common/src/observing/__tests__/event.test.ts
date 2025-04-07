import { Event, oneTimeSubscription } from '../event.js';
import { setTimeoutAsync } from '../../async/timeout.js';
import * as Logger from '../../logger/index.js';

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
        expect(e.isEmpty).toBe(true);
        const handler = vi.fn();
        const unsubscribe = e.on(handler);
        expect(e.isEmpty).toBe(false);
        unsubscribe();
        expect(e.isEmpty).toBe(true);
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
            throw new Error('test1');
        });

        e.on(() => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw 'test2';
        });

        e.on(() => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw 123;
        });

        e.on(async (arg) => {
            await setTimeoutAsync(100);
            handler1(arg);
        });

        await expect(e.triggerAsync(123)).resolves.toEqual([
            new Error('test1'),
            new Error('test2'),
            new Error('Event handler thrown an exception: 123'),
        ]);
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

    it('with logger', () => {
        const e = new Event<number>(false);

        const handlerThrows = vi.fn(() => {
            throw new Error('test');
        });
        e.on(handlerThrows);

        const mockLogger = {
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        } satisfies Logger.ILogger;

        // test that `createLogger` was called
        // mock `createLogger` so we can check arguments passed to it and we should return our mock logger
        const createLoggerSpy = vi.spyOn(Logger, 'createLogger').mockReturnValue(mockLogger);
        e.withLogger('test');
        expect(createLoggerSpy).toHaveBeenCalledWith('[Event:test]');

        e.withLogger(mockLogger);
        expect((e as any)._logger).toBe(mockLogger);

        // trigger the event and and check logger.error was called
        e.trigger(1);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).toHaveBeenCalledWith('[Event.number] Handler spy thrown an exception: ', new Error('test'));
        expect(handlerThrows).toHaveBeenCalledTimes(1);
        expect(handlerThrows).toHaveBeenCalledWith(1);
        expect(handlerThrows).toHaveBeenCalledBefore(mockLogger.error);

        mockLogger.error.mockReset();
        handlerThrows.mockReset();

        e.withLogger(null);
        e.trigger(2);
        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(handlerThrows).toHaveBeenCalledTimes(1);
        expect(handlerThrows).toHaveBeenCalledWith(2);

    });
});
