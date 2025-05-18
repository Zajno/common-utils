import { BufferedLogger } from '../buffered/buffered.logger.js';
import { BufferedMemoryLogger } from '../buffered/buffered.memory.js';
import type { ILogger } from '../types.js';

describe('logger / buffered', () => {
    const createCustomLogger = () => ({
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    } satisfies ILogger);

    test('logger', () => {
        const mock = createCustomLogger();

        const buffered = new BufferedLogger('test', mock)
            .withMaxBufferSize(2);

        expect(buffered.getBuffer()).toEqual([]);
        expect(buffered.entries).toEqual(0);
        expect(buffered.maxBufferSize).toEqual(2);

        buffered.log('log1');
        expect(buffered.getBuffer()).toHaveLength(1);
        expect(buffered.entries).toEqual(1);

        expect(mock.log).not.toHaveBeenCalled();
        expect(mock.warn).not.toHaveBeenCalled();
        expect(mock.error).not.toHaveBeenCalled();

        buffered.log('log2');
        expect(mock.log).toHaveBeenCalledWith('test', '\n\t--->', 'log1', '\n\t--->', 'log2');
        expect(mock.warn).not.toHaveBeenCalled();
        expect(mock.error).not.toHaveBeenCalled();
        mock.log.mockClear();

        buffered.warn('warn1');
        expect(mock.log).not.toHaveBeenCalled();
        expect(mock.warn).not.toHaveBeenCalled();
        expect(mock.error).not.toHaveBeenCalled();
        buffered.log('log3');
        expect(mock.log).not.toHaveBeenCalled();
        expect(mock.warn).toHaveBeenCalledWith('test', '\n\t---> [WARN]', 'warn1', '\n\t--->', 'log3');
        expect(mock.error).not.toHaveBeenCalled();

        mock.warn.mockClear();

        buffered.error('error1');
        expect(mock.log).not.toHaveBeenCalled();
        expect(mock.warn).not.toHaveBeenCalled();
        expect(mock.error).not.toHaveBeenCalled();
        buffered.warn('warn2');
        expect(mock.log).not.toHaveBeenCalled();
        expect(mock.warn).not.toHaveBeenCalled();
        expect(mock.error).toHaveBeenCalledWith('test', '\n\t---> [ERROR]', 'error1', '\n\t---> [WARN]', 'warn2');

        mock.error.mockClear();

        buffered.log('log4');
        expect(mock.log).not.toHaveBeenCalled();

        expect(buffered.entries).toEqual(1);
        expect(buffered.getBuffer()).toHaveLength(1);

        buffered.dispose();

        expect(mock.log).toHaveBeenCalledWith('test', '\n\t--->', 'log4');
        expect(buffered.entries).toEqual(0);
        expect(buffered.getBuffer()).toEqual([]);
    });

    test('memory', () => {
        const logger = new BufferedMemoryLogger('test')
            .withMaxBufferSize(2);

        logger.log('log1');
        expect(logger.getMemory()).toEqual([]); // not flushed yet
        expect(logger.entries).toEqual(1);
        expect(logger.maxBufferSize).toEqual(2);

        logger.log('log2');
        expect(logger.getMemory()).toEqual(['[LOG] log1', '[LOG] log2']);

        logger.clearMemory();
        expect(logger.getMemory()).toHaveLength(0);

        logger.log({ a: 1, b: true });
        logger.flush();
        expect(logger.getMemory(true)).toEqual(['[LOG] {"a":1,"b":true}']);
        expect(logger.getMemory()).toHaveLength(0);
        expect(logger.entries).toEqual(0);
    });
});
