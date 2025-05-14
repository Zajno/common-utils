import { batchLoggers, ILogger, LoggerFunction, LoggersManager } from '../index.js';
import { faker } from '@faker-js/faker';
import fc from 'fast-check';
import { MockInstance } from 'vitest';
import { toArbitrary } from '../../../utils/tests/main.js';
import { CONSOLE, ConsoleLogger } from '../console.js';
import { BufferedLogger } from '../buffered.js';
import { EMPTY_FUNCTION, EMPTY_LOGGER } from '../empty.js';

const { logger, getMode, setMode, createLogger } = new LoggersManager().expose();

describe('#logger-tests', () => {

  const createCustomLogger = () => ({
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } satisfies ILogger);

  const createConsoleMocks = () => ({
    log: vi.spyOn(CONSOLE, 'log').mockImplementation(EMPTY_FUNCTION),
    warn: vi.spyOn(CONSOLE, 'warn').mockImplementation(EMPTY_FUNCTION),
    error: vi.spyOn(CONSOLE, 'error').mockImplementation(EMPTY_FUNCTION),
  } satisfies Record<keyof ILogger, MockInstance<LoggerFunction>>);

  const loggerMethods = Object.keys(createCustomLogger()) as (keyof ILogger)[];
  const clearMocks = (mocks: ReturnType<typeof createConsoleMocks>) => loggerMethods.forEach(m => mocks[m].mockClear());

  it('use logger without mode (default logger)', () => {
    const _textToLog = toArbitrary(() => faker.internet.url());
    let iteration = 0;

    const consoleMocks = createConsoleMocks();

    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        const methodName = loggerMethods[iteration];
        logger[methodName](textToLog);

        expect(getMode()).toBe(false);
        expect(consoleMocks[methodName]).not.toHaveBeenCalled();

        ++iteration;
      }), {
      numRuns: loggerMethods.length,
    });

    clearMocks(consoleMocks);
  });

  it('use logger with runtime mode disabling', () => {
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.lorem.word());
    const consoleMocks = createConsoleMocks();

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        // set mode before or after creating a new logger

        if (iteration % 2 === 0) {
          setMode('console');
          setMode(() => createCustomLogger());
          setMode(false);
        }
        const logger = createLogger(faker.lorem.word());
        if (iteration % 2 === 1) {
          setMode('console');
          setMode(() => createCustomLogger());
          setMode(false);
        }

        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        expect(getMode()).toBe(false);
        expect(consoleMocks[methodName]).not.toHaveBeenCalled();
        ++iteration;
      }), {
      numRuns: loggerMethods.length * 2,
    });

    clearMocks(consoleMocks);
  });

  it('use logger with \'null\' mode', () => {
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.internet.url());

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        if (iteration % 2 === 0) setMode(undefined);
        const logger = createLogger(faker.lorem.word());
        if (iteration % 2 === 1) setMode(null);

        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        const spyLogger = vi.spyOn(CONSOLE, methodName);

        expect(getMode()).toBeFalsy();
        expect(spyLogger).not.toHaveBeenCalled();
        ++iteration;
      }), {
      numRuns: loggerMethods.length * 2,
    });
  });

  it('use logger with \'console\' mode', () => {
    const loggerName = `[${faker.lorem.word()}]`;
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.lorem.word());
    const consoleMocks = createConsoleMocks();

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {

        if (iteration % 2 === 0) setMode('console');
        const logger = createLogger(loggerName);
        if (iteration % 2 === 1) setMode('console');
        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        expect(getMode()).toBe('console');
        expect(consoleMocks[methodName]).toHaveBeenCalledWith(loggerName, textToLog);
        consoleMocks[methodName].mockClear();

        ++iteration;
      }), {
      numRuns: loggerMethods.length * 2,
    });

    clearMocks(consoleMocks);
  });

  it('use logger with custom mode', () => {
    const loggerName = `[${faker.lorem.word()}]`;
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.lorem.word());

    const customLogger = createCustomLogger();
    const customLoggerGetter = () => customLogger;

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        if (iteration % 2 === 0) {
          setMode(customLoggerGetter);
        }
        const logger = createLogger(loggerName);
        if (iteration % 2 === 1) {
          setMode(customLoggerGetter);
        }

        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        const impl = customLogger[methodName];

        expect(getMode()).toBe(customLoggerGetter);
        expect(impl).toHaveBeenCalledWith(loggerName, textToLog);
        impl.mockClear();
        ++iteration;
      }), {
      numRuns: loggerMethods.length * 2,
    });
  });

  it('use logger with override mode #override', () => {

    const loggerName = `[${faker.lorem.word()}]`;
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.lorem.word());
    const consoleMocks = createConsoleMocks();

    const customLogger = createCustomLogger();
    const customLoggerGetter = () => customLogger;

    setMode('console');

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        const loggerDisabled = createLogger(loggerName, false);
        const loggerCustom = createLogger(loggerName, customLoggerGetter);

        const methodName = loggerMethods[iteration % 3];
        loggerDisabled[methodName](textToLog);
        expect(consoleMocks[methodName]).not.toHaveBeenCalled();

        loggerCustom[methodName](textToLog);

        expect(consoleMocks[methodName]).not.toHaveBeenCalled();

        const impl = customLogger[methodName];
        expect(impl).toHaveBeenCalledWith(loggerName, textToLog);
        impl.mockClear();

        ++iteration;
      }), {
      numRuns: loggerMethods.length,
    });

    expect(getMode()).toBe('console');
    clearMocks(consoleMocks);

  });

  it('batches loggers', () => {

    const loggerName = `[${faker.lorem.word()}]`;
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.lorem.word());
    const consoleMocks = createConsoleMocks();
    const customLogger = createCustomLogger();
    const customLoggerGetter = () => customLogger;

    setMode(false);

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        const logger = batchLoggers(
          createLogger(loggerName, 'console'),
          createLogger(loggerName, customLoggerGetter),
        );

        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        expect(consoleMocks[methodName]).toHaveBeenCalledWith(loggerName, textToLog);
        const impl = customLogger[methodName];
        expect(impl).toHaveBeenCalledWith(loggerName, textToLog);
        impl.mockClear();

        ++iteration;
      }), {
      numRuns: loggerMethods.length,
    });

    expect(getMode()).toBe(false);
    clearMocks(consoleMocks);

    expect(batchLoggers(null, undefined)).toStrictEqual(EMPTY_LOGGER);
  });

  it('correctly initializes if created with empty name after mode is set #after', () => {

    const customLogger = createCustomLogger();
    const customLoggerGetter = () => customLogger;

    setMode(customLoggerGetter);

    const logger = createLogger('');
    logger.log('test');

    expect(customLogger.log).toHaveBeenCalledWith('test');
    clearMocks(customLogger);
  });

  test('console / base', () => {
    const consoleMocks = createConsoleMocks();

    const base = new ConsoleLogger('test');
    base.enable();

    base.log('log');
    expect(consoleMocks.log).toHaveBeenCalledWith('test', 'log');

    base.warn('warn');
    expect(consoleMocks.warn).toHaveBeenCalledWith('test', 'warn');

    base.error('error');
    expect(consoleMocks.error).toHaveBeenCalledWith('test', 'error');

    clearMocks(consoleMocks);
  });

  test('console / buffered', () => {
    const mock = createCustomLogger();

    const buffered = new BufferedLogger('test', mock)
      .withMaxBufferSize(2);

    expect(buffered.dump).toEqual([]);
    expect(buffered.entries).toEqual(0);
    expect(buffered.maxBufferSize).toEqual(2);

    buffered.log('log1');
    expect(buffered.dump).toEqual(['\t--->', 'log1']);
    expect(buffered.entries).toEqual(1);

    expect(mock.log).not.toHaveBeenCalled();
    expect(mock.warn).not.toHaveBeenCalled();
    expect(mock.error).not.toHaveBeenCalled();

    buffered.log('log2');
    expect(mock.log).toHaveBeenCalledWith('test', '\t--->', 'log1', '\t--->', 'log2');
    expect(mock.warn).not.toHaveBeenCalled();
    expect(mock.error).not.toHaveBeenCalled();
    mock.log.mockClear();

    buffered.warn('warn1');
    expect(mock.log).not.toHaveBeenCalled();
    expect(mock.warn).not.toHaveBeenCalled();
    expect(mock.error).not.toHaveBeenCalled();
    buffered.log('log3');
    expect(mock.log).not.toHaveBeenCalled();
    expect(mock.warn).toHaveBeenCalledWith('test', '\t---> [WARN]', 'warn1', '\t--->', 'log3');
    expect(mock.error).not.toHaveBeenCalled();

    mock.warn.mockClear();

    buffered.error('error1');
    expect(mock.log).not.toHaveBeenCalled();
    expect(mock.warn).not.toHaveBeenCalled();
    expect(mock.error).not.toHaveBeenCalled();
    buffered.warn('warn2');
    expect(mock.log).not.toHaveBeenCalled();
    expect(mock.warn).not.toHaveBeenCalled();
    expect(mock.error).toHaveBeenCalledWith('test', '\t---> [ERROR]', 'error1', '\t---> [WARN]', 'warn2');

    mock.error.mockClear();

    buffered.log('log4');
    expect(mock.log).not.toHaveBeenCalled();

    expect(buffered.entries).toEqual(1);
    expect(buffered.dump).toEqual(['\t--->', 'log4']);

    buffered.dispose();

    expect(mock.log).toHaveBeenCalledWith('test', '\t--->', 'log4');
    expect(buffered.entries).toEqual(0);
    expect(buffered.dump).toEqual([]);
  });

  test('manager / attach + detach', () => {
    const mock = createCustomLogger();

    const manager = new LoggersManager();

    const logger = manager.attach(mock);
    expect(manager.recognize(mock)).toBeNull();
    expect(manager.recognize(logger)).toBe(logger);
    expect(manager.mode).toBe(false);

    manager.setMode('console');
    expect(manager.mode).toBe('console');
    expect(logger.isEnabled).toBe(true);

    manager.setMode(false);
    expect(manager.mode).toBe(false);
    expect(logger.isEnabled).toBe(false);

    expect((logger as any)._logger).toBe(mock);

    expect(manager.detach(mock)).toBe(false);

    expect(manager.detach(logger)).toBe(true);
    expect(manager.recognize(logger)).toBeNull();
    expect(logger.isEnabled).toBe(false);

    manager.setMode('console');
    expect(logger.isEnabled).toBe(false);

    const logger2 = manager.attach(mock);
    expect(logger2.isEnabled).toBe(true);
    expect(manager.detach(logger2, true)).toBe(true);
    expect(logger2.isEnabled).toBe(false);
  });

  test('manager / destinations', () => {
    const mockMode = createCustomLogger();
    const mockDest = createCustomLogger();

    const manager = new LoggersManager();
    manager.setMode(mockMode);
    expect(manager.mode).toBe(mockMode);

    const removeDest = manager.addDestination(mockDest, 'dest');
    expect((manager as any)._destinations).toHaveLength(1);

    const logger = manager.create('test');
    logger.log('log');

    expect(mockMode.log).toHaveBeenCalledWith('test', 'log');
    expect(mockDest.log).toHaveBeenCalledWith('dest', 'test', 'log');

    mockMode.log.mockClear();
    mockDest.log.mockClear();

    removeDest();
    expect((manager as any)._destinations).toHaveLength(0);
    expect(manager.mode).toBe(mockMode);

    logger.log('log2');
    expect(mockMode.log).toHaveBeenCalledWith('test', 'log2');
    expect(mockDest.log).not.toHaveBeenCalled();

    mockMode.log.mockClear();
    mockDest.log.mockClear();

    manager.setMode(() => null!);
    logger.log('log3');

    expect(mockMode.log).not.toHaveBeenCalled();
    expect(mockDest.log).not.toHaveBeenCalled();
  });

});
