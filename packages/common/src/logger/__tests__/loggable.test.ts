import { EMPTY_LOGGER } from '../empty.js';
import { Loggable } from '../loggable.js';
import type { ILogger, ILoggerFactory } from '../types.js';

describe('Loggable', () => {

    const createMock: ILoggerFactory = (_name: string | undefined) => ({
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    } satisfies ILogger);

    // expose protected stuff
    type LoggableInternal = Loggable & { logger: ILogger | null, hasLogger: boolean };

    test('works', () => {
        {
            const loggable = new Loggable() as LoggableInternal;
            expect(loggable.logger).toBe(EMPTY_LOGGER);
            expect(loggable.hasLogger).toBeFalse();
        }

        const mock = createMock('mock');
        const loggable = new Loggable(mock) as LoggableInternal;
        expect(loggable.logger).toBe(mock);

        loggable.setLogger(null);
        expect(loggable.logger).toBe(EMPTY_LOGGER);
        expect(loggable.hasLogger).toBeFalse();

        loggable.setLogger(() => mock);
        expect(loggable.logger).toBe(mock);

        loggable.setLogger(() => null);
        expect(loggable.logger).toBe(EMPTY_LOGGER);
        expect(loggable.hasLogger).toBeFalse();

        const factory = vi.fn(() => mock);
        loggable.setLoggerFactory(factory, 'mock');
        expect(loggable.logger).toBe(mock);
        expect(factory).toHaveBeenCalledWith('[mock]');
        expect(factory).toHaveBeenCalledTimes(1);

        factory.mockClear();

        loggable.setLoggerFactory(factory, undefined);
        expect(loggable.logger).toBe(mock);
        expect(factory).toHaveBeenCalledWith('');
        expect(factory).toHaveBeenCalledTimes(1);

        factory.mockClear();

        loggable.setLoggerFactory(null, 'mock');
        expect(loggable.logger).toBe(EMPTY_LOGGER);
        expect(loggable.hasLogger).toBeFalse();
        expect(factory).not.toHaveBeenCalled();
    });
});
