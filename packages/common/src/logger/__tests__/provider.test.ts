import { EMPTY_LOGGER } from '../empty.js';
import { LoggerProvider } from '../provider.js';
import type { ILogger } from '../types.js';

describe('LoggerProvider', () => {

    type LoggerProviderInternal = LoggerProvider & { getLoggerName(name: string | undefined): string; hasLogger: boolean; };

    test('works', () => {
        {
            const loggable = new LoggerProvider() as LoggerProviderInternal;
            expect(loggable.logger).toBe(EMPTY_LOGGER);
            expect(loggable.hasLogger).toBeFalse();
            expect(loggable.factory).toBeNull();
        }

        const formatter = vi.fn((name: string | undefined) => `[${name}]`);
        const mock = {
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        } satisfies ILogger;

        const provider = new LoggerProvider(formatter) as LoggerProviderInternal;

        provider.setLogger(mock);
        expect(provider.logger).toBe(mock);
        expect(provider.factory).toBeNull();
        expect(provider.createLogger('test')).toBeNull();
        expect(formatter).not.toHaveBeenCalled();
        expect((provider).getLoggerName('mock')).toBe('[mock]');

        formatter.mockClear();

        const factory = vi.fn(() => mock);
        provider.setLoggerFactory(factory, 'mock');

        expect(provider.logger).toBe(mock);
        expect(provider.factory).toBe(factory);
        expect(formatter).toHaveBeenCalledWith('mock');
        expect(formatter).toHaveBeenCalledTimes(1);
        expect(factory).toHaveBeenCalledWith('[mock]');
        expect(factory).toHaveBeenCalledTimes(1);

        formatter.mockClear();
        factory.mockClear();

        const logger = provider.createLogger('test', 'console');
        expect(logger).toBe(mock);
        expect(factory).toHaveBeenCalledWith('[test]', 'console');
        expect(factory).toHaveBeenCalledTimes(1);
        expect(formatter).toHaveBeenCalledWith('test');
        expect(formatter).toHaveBeenCalledTimes(1);
    });
});
