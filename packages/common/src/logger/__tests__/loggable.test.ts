import { Loggable } from '../loggable.js';
import type { ILogger, ILoggerFactory } from '../types.js';

describe('Loggable', () => {

    const createMock: ILoggerFactory = (_name: string | undefined) => ({
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    } satisfies ILogger);

    type LoggableInternal = Loggable & { logger: ILogger | null };

    test('works', () => {
        {
            const loggable = new Loggable() as LoggableInternal;
            expect(loggable.logger).toBeNull();
        }

        const mock = createMock('mock');
        const loggable = new Loggable(mock) as LoggableInternal;
        expect(loggable.logger).toBe(mock);

        loggable.setLogger(null);
        expect(loggable.logger).toBeNull();

        loggable.setLogger(() => mock);
        expect(loggable.logger).toBe(mock);

        loggable.setLogger(() => null);
        expect(loggable.logger).toBeNull();

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
        expect(loggable.logger).toBeNull();
        expect(factory).not.toHaveBeenCalled();
    });
});
