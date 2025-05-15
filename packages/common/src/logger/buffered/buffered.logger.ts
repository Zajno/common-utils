import { clamp } from '../../math/calc.js';
import { LogLevels, LogLevelValues, type ILogger, type LoggerFunction } from '../types.js';
import { BaseBufferedLogger, LogEntry } from './base.js';

const Prefixes: Record<LogLevelValues, string> = {
    [1]: '\n\t--->',
    [2]: '\n\t---> [WARN]',
    [3]: '\n\t---> [ERROR]',
};

export class BufferedLogger extends BaseBufferedLogger {

    private readonly _target: ILogger;
    private _binded: Record<number, LoggerFunction>;

    constructor(name: string, target: ILogger) {
        super(name);
        this._target = target;
        this._binded = {
            [LogLevels.log]: this._target.log.bind(this._target),
            [LogLevels.warn]: this._target.warn.bind(this._target),
            [LogLevels.error]: this._target.error.bind(this._target),
        };
    }

    protected doFlush(buffer: LogEntry[]) {
        const result: any[] = [
            this.name,
        ];
        let maxLevel: number = LogLevels.log;

        for (const [level, args] of buffer) {
            if (level > maxLevel) {
                maxLevel = level;
            }

            result.push(
                Prefixes[level],
                ...args,
            );
        }

        maxLevel = clamp(maxLevel, LogLevels.log, LogLevels.error);

        this._binded[maxLevel](...result);
    }
}
