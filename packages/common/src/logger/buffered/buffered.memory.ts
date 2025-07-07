import type { LogLevelValues } from '../types.js';
import { BaseBufferedLogger, type LogEntry } from './base.js';

const Prefixes: Record<LogLevelValues, string> = {
    [1]: '[LOG]',
    [2]: '[WARN]',
    [3]: '[ERROR]',
};

export class BufferedMemoryLogger extends BaseBufferedLogger {

    protected _memory: string[] = [];
    private _timestamps: boolean = false;
    private _maxMemorySize: number = 0;

    private _argFormatter = formatArg;
    private _argsJoiner = (args: string[]): string => args.filter(Boolean).join(' ');

    constructor(name: string) {
        super(name);
    }

    withMaxMemorySize(size: number) {
        this._maxMemorySize = size;
        return this;
    }

    setArgsJoiner(joiner: (args: string[]) => string) {
        this._argsJoiner = joiner;
        return this;
    }

    setArgFormatter(formatter: (arg: unknown) => string) {
        this._argFormatter = formatter;
        return this;
    }

    withTimestamps() {
        this._timestamps = true;
        return this;
    }

    public getMemory(clear = false): string[] {
        if (clear) {
            const copy = this._memory;
            this._memory = [];
            return copy;
        }

        return this._memory.slice();
    }

    public clearMemory() {
        this._memory.length = 0;
    }

    protected getPrefix(level: LogLevelValues) {
        return Prefixes[level];
    }

    protected getTimestamp(timestamp: number) {
        return new Date(timestamp).toISOString();
    }

    protected formatLine(line: any[]) {
        return this._argsJoiner(line.map(this._argFormatter));
    }

    protected doFlush(buffer: LogEntry[]): void {
        for (const [level, args, timestamp] of buffer) {
            const line = this.combineLine(level, args, timestamp);
            this._memory.push(line);
        }

        if (this._maxMemorySize > 0 && this._memory.length > this._maxMemorySize) {
            this._memory.splice(0, this._memory.length - this._maxMemorySize);
        }
    }

    protected combineLine(level: LogLevelValues, args: any[], timestamp: number) {
        const line: any[] = [];

        if (this._timestamps) {
            line.push(this.getTimestamp(timestamp));
        }

        line.push(this.getPrefix(level), ...args);

        return this.formatLine(line);
    }
}

function formatArg(arg: any): string {
    if (typeof arg === 'object') {
        if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
        }

        return JSON.stringify(arg);
    }
    return String(arg);
}
