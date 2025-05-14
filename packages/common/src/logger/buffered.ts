import type { IDisposable } from '../functions/disposer.js';
import { clamp } from '../math/calc.js';
import { EMPTY_FUNCTION } from './empty.js';
import type { ILogger, LoggerFunction } from './types.js';

export class BufferedLogger implements ILogger, IDisposable {
    private readonly _name: string;
    private readonly _logs: string[] = [];
    private _level = 0;

    private readonly _target: ILogger;
    private _log: LoggerFunction = EMPTY_FUNCTION;

    private _entries = 0;
    private _maxBufferSize = 100;
    private _binded: LoggerFunction[];

    constructor(name: string, target: ILogger) {
        this._name = name || '';
        this._target = target;
        this._binded = [
            this._target.log.bind(this._target),
            this._target.warn.bind(this._target),
            this._target.error.bind(this._target),
        ];

        this._resetLevel();
    }

    public get entries() { return this._entries; }
    public get maxBufferSize() { return this._maxBufferSize; }
    public get dump() { return this._logs.slice(); }

    withMaxBufferSize(size: number) {
        this._maxBufferSize = size;
        return this;
    }

    log(...args: any[]) {
        this._logs.push('\t--->', ...args);
        this.trackEntry();
    }

    warn(...args: any[]) {
        this._logs.push('\t---> [WARN]', ...args);
        this._raiseLevel(2);
        this.trackEntry();
    }

    error(...args: any[]) {
        this._logs.push('\t---> [ERROR]', ...args);
        this._raiseLevel(3);
        this.trackEntry();
    }

    flush() {
        if (this._logs.length > 0) {
            this._log(this._name, ...this._logs);
            this._logs.length = 0;
        }
        this._entries = 0;
        this._resetLevel();
    }

    dispose(): void {
        this.flush();
    }

    private trackEntry() {
        ++this._entries;

        if (this._entries >= this._maxBufferSize) {
            this.flush();
        }
    }

    private _resetLevel() {
        this._level = 1;
        this._log = this._binded[0];
    }

    private _raiseLevel(l: number) {
        const level = clamp(l, 1, 3);

        // level can only raise
        if (level <= this._level) {
            return;
        }

        this._level = level;
        this._log = this._binded[level - 1];
    }
}
