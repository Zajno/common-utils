
/* eslint-disable no-console */
import * as Path from 'path';
import * as FS from 'fs';
import * as Util from 'util';

import { ILogger } from './abstractions';

export class FileLoggerNode implements ILogger {
    private readonly _buffer: string[] = [];
    private _logFilePath: string = null;

    constructor(readonly extraLogger: ILogger = console, readonly instantFlush = false) {
        this.setLogName('');
    }

    setLogFilePath(path: string) {
        this._logFilePath = path;
        return this;
    }

    setLogName(name: string) {
        const n = name ? `-${name}` : '';
        this._logFilePath = Path.resolve(__dirname, `../run${n}.${new Date().toISOString()}.log`);
        return this;
    }

    private append(..._args: any[]) {
        // @ts-ignore
        const str = Util.format.apply(null, arguments) + '\n';
        this._buffer.push(str);

        if (this.instantFlush) {
            this.flush();
        }
    }

    log = (...args: any[]) => {
        this.extraLogger?.log(...args);
        this.append(...args);
    };

    warn = (...args: any[]) => {
        this.extraLogger?.warn(...args);
        this.append(...args);
    };

    error = (...args: any[]) => {
        this.extraLogger?.error(...args);
        this.append(...args);
    };

    flush() {
        if (!this._buffer.length) {
            return;
        }

        try {
            FS.appendFileSync(this._logFilePath, this._buffer.join(''));
        } catch (err) {
            console.warn('Failed to flush file, error', err);
        } finally {
            this._buffer.length = 0;
        }
    }
}
