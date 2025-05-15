import type { IDisposable } from '../../functions/disposer.js';
import { LogLevels, type LogLevelValues, type ILogger } from '../types.js';

type Timestamp = number;
export type LogEntry = [LogLevelValues, any[], Timestamp];

export abstract class BaseBufferedLogger implements ILogger, IDisposable {
    private readonly _buffer: LogEntry[] = [];
    private _maxBufferSize = 100;

    constructor(public readonly name: string) { }

    public get entries() { return this._buffer.length; }
    public get maxBufferSize() { return this._maxBufferSize; }

    public getBuffer() { return this._buffer.slice(); }

    withMaxBufferSize(size: number) {
        this._maxBufferSize = size;
        return this;
    }

    log(...args: any[]) {
        this._buffer.push([LogLevels.log, args, Date.now()]);
        this.tryAutoFlush();
    }

    warn(...args: any[]) {
        this._buffer.push([LogLevels.warn, args, Date.now()]);
        this.tryAutoFlush();
    }

    error(...args: any[]) {
        this._buffer.push([LogLevels.error, args, Date.now()]);
        this.tryAutoFlush();
    }

    flush() {
        if (this._buffer.length > 0) {
            const copy = this._buffer.slice();
            this._buffer.length = 0;
            this.doFlush(copy);
            this.onFlushed();
        }
    }

    dispose(): void {
        this.flush();
    }

    protected abstract doFlush(buffer: LogEntry[]): void;

    protected onFlushed() {
        // Optional: Override to handle post-flush actions
    }

    protected tryAutoFlush() {
        if (this._buffer.length >= this._maxBufferSize) {
            this.flush();
        }
    }

}
