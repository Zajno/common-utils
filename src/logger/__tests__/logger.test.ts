import { faker } from '@faker-js/faker';
import logger, { batchLoggers, createLogger, getMode, ILogger, setMode } from '..';
import fc from 'fast-check';
import { toArbitrary } from '../../__tests__/helpers/main';

const CONSOLE = console;

describe('#logger-tests', () => {

  const createCustomLogger = () => ({
    log: jest.fn().mockImplementation(),
    warn: jest.fn().mockImplementation(),
    error: jest.fn().mockImplementation(),
  });

  const createConsoleMocks = (): Record<keyof ILogger, jest.SpyInstance> => ({
    log: jest.spyOn(CONSOLE, 'log').mockImplementation(),
    warn: jest.spyOn(CONSOLE, 'warn').mockImplementation(),
    error: jest.spyOn(CONSOLE, 'error').mockImplementation(),
  });
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
        if (iteration % 2 === 0) setMode(null);
        const logger = createLogger(faker.lorem.word());
        if (iteration % 2 === 1) setMode(null);

        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBeNull();
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

});
