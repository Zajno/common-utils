import faker from 'faker';
import logger, { createLogger, getMode, LoggerFactory, setMode } from '../';
import fc from 'fast-check';
import { toArbitrary } from '../../__tests__/helpers/main';

const CONSOLE = console;

describe('#logger-tests', () => {

    const customLogger: LoggerFactory = () => ({ log: CONSOLE.log, warn: CONSOLE.warn, error: CONSOLE.error });
    const loggerMethods: ['log', 'warn', 'error'] = ['log', 'warn', 'error'];

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

  it('use logger with \'false\' mode', () => {
    const logger = createLogger(faker.random.word());
    setMode(false);
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.internet.url());
    let iteration = 0;

    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        const methodName = loggerMethods[iteration];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBeFalsy();
        expect(spyLogger).not.toHaveBeenCalled();
        ++iteration;
      }), {
        numRuns: loggerMethods.length,
      });
  });

  it('use logger with \'null\' mode', () => {
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.internet.url());
    let iteration = 0;

    const logger = createLogger(faker.random.word());
    setMode(null);

    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        const methodName = loggerMethods[iteration];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBeNull();
        expect(spyLogger).not.toHaveBeenCalled();
        ++iteration;
      }), {
        numRuns: loggerMethods.length,
      });
  });

  it('use logger with \'console\' mode', () => {
    const loggerName = `[${faker.random.word()}]`;
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.random.word());

    const logger = createLogger(loggerName);
    setMode('console');

    let iteration = 0;

    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        const methodName = loggerMethods[iteration];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBe('console');
        expect(spyLogger).toHaveBeenCalledWith(loggerName, textToLog);
        ++iteration;
      }), {
        numRuns: loggerMethods.length,
      });
  });

  it('use logger with custom mode', () => {
    const loggerName = `[${faker.random.word()}]`;
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.random.word());

    const logger = createLogger(loggerName);
    setMode(customLogger);

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        const methodName = loggerMethods[iteration];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBe(customLogger);
        expect(spyLogger).toHaveBeenCalledWith(loggerName, textToLog);
        ++iteration;
      }), {
        numRuns: loggerMethods.length,
      });
  });

  it('use logger with runtime mode nulling', () => {
    const _textToLog: fc.Arbitrary<string> = toArbitrary(() => faker.random.word());
    const logger = createLogger(faker.random.word());

    setMode('console');
    setMode(customLogger);
    setMode(false);

    let iteration = 0;
    fc.assert(
      fc.property(_textToLog, (textToLog) => {
        const methodName = loggerMethods[iteration];
        logger[methodName](textToLog);

        const spyLogger = jest.spyOn(CONSOLE, methodName);

        expect(getMode()).toBeFalsy();
        expect(spyLogger).not.toHaveBeenCalledWith();
        ++iteration;
    }), {
      numRuns: loggerMethods.length,
    });
  });

});
