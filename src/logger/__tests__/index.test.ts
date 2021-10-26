import faker from 'faker';
import logger, { createLogger, getMode, LoggerFactory, setMode } from '../';
import fc from 'fast-check';
import { toArbitrary } from '../../__tests__/helpers/main';

const CONSOLE = console;

describe('#logger-tests', () => {

  const customLogger: LoggerFactory = () => ({ log: CONSOLE.log, warn: CONSOLE.warn, error: CONSOLE.error });
  const loggerMethods = ['log', 'warn', 'error'] as const;

  it('use logger without mode (default logger)', () => {
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.internet.url());
    let iteration = 0;

    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        const methodName = loggerMethods[iteration];
        logger[methodName](textToLog);

        const spyCLog = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBeFalsy();
        expect(spyCLog).not.toHaveBeenCalled();

        ++iteration;
      }), {
        numRuns: loggerMethods.length,
      });
  });

  it('use logger with runtime mode nulling', () => {
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.random.word());

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        if (iteration % 2 === 0) { setMode('console'); setMode(customLogger); setMode(false); }
        const logger = createLogger(faker.random.word());
        if (iteration % 2 === 1) { setMode('console'); setMode(customLogger); setMode(false); }

        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(customLogger(), methodName);

        expect(getMode()).toBeFalsy();
        expect(spyLogger).not.toHaveBeenCalled();
        ++iteration;
    }), {
      numRuns: loggerMethods.length * 2,
    });
  });

  it('use logger with \'false\' mode', () => {
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.internet.url());

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        if (iteration % 2 === 0) setMode(false);
        const logger = createLogger(faker.random.word());
        if (iteration % 2 === 1) setMode(false);

        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBeFalsy();
        expect(spyLogger).not.toHaveBeenCalled();
        ++iteration;
      }), {
        numRuns: loggerMethods.length * 2,
      });
  });

  it('use logger with \'null\' mode', () => {
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.internet.url());

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        if (iteration % 2 === 0) setMode(null);
        const logger = createLogger(faker.random.word());
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
    const loggerName = `[${faker.random.word()}]`;
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.random.word());

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {

        if (iteration % 2 === 0) setMode('console');
        const logger = createLogger(loggerName);
        if (iteration % 2 === 1) setMode('console');
        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBe('console');
        expect(spyLogger).toHaveBeenCalledWith(loggerName, textToLog);
        ++iteration;
      }), {
        numRuns: loggerMethods.length * 2,
      });
  });

  it('use logger with custom mode', () => {
    const loggerName = `[${faker.random.word()}]`;
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.random.word());

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        if (iteration % 2 === 0) setMode(customLogger);
        const logger = createLogger(loggerName);
        if (iteration % 2 === 1) setMode(customLogger);

        const methodName = loggerMethods[iteration % 3];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBe(customLogger);
        expect(spyLogger).toHaveBeenCalledWith(loggerName, textToLog);
        ++iteration;
      }), {
        numRuns: loggerMethods.length * 2,
      });
  });

});
