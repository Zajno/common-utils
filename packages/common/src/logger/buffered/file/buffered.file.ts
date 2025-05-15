
/* eslint-disable no-console */
import * as Path from 'node:path';
import * as FS from 'node:fs';
import * as Util from 'node:util';

import { BufferedMemoryLogger } from '../buffered.memory.js';

export class FileLoggerNode extends BufferedMemoryLogger {
    private _logFilePath: string | null = null;

    setLogFilePath(path: string) {
        this._logFilePath = path;
        return this;
    }

    setLogName(name: string) {
        const n = name ? `-${name}` : '';
        this._logFilePath = Path.resolve(process.cwd(), `run${n}.${new Date().toISOString()}.log`);
        return this;
    }

    protected formatLine(line: any[]): string {
        return Util.format.apply(null, line);
    }

    protected onFlushed(): void {
        super.onFlushed();

        // should transfer the internal buffer to the memory, formatted
        // copy and clear the memory
        const memory = this.getMemory(true);

        try {
            if (this._logFilePath) {
                this.appendToFileSync(this._logFilePath, memory.join(''));
            }
        } catch (err) {
            console.warn('Failed to flush file, error', err);
        }
    }

    protected appendToFileSync(path: string, data: string) {
        FS.appendFileSync(path, data);
    }
}
