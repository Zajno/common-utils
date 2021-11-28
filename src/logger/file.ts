import * as FS from 'fs';
import * as Util from 'util';
import { ILogger } from './abstractions';
import { Getter } from '../types';

export class FileLoggerNode implements ILogger {
    private readonly _buffer: string[];

    constructor(readonly fileName: Getter<string>, bufferMode = false) {
        this._buffer = bufferMode ? [] : null;
    }

    /** @example Path.resolve(__dirname, `../run.${new Date().toISOString()}.log`) */
    private get logFilePath() { return Getter.getValue(this.fileName); }

    log = (...args: any[]) => {
        this.appendToFile(...args);
    };

    warn(...args: any[]) {
        this.appendToFile(...args);
    }

    error(...args: any[]) {
        this.appendToFile(...args);
    }

    public flush() {
        if (!this._buffer) {
            return;
        }

        FS.writeFileSync(this.logFilePath, this._buffer.join(''));
        this._buffer.length = 0;
    }

    private appendToFile(..._args: any[]) {
        // @ts-ignore
        const str = Util.format.apply(null, arguments) + '\n';
        if (this._buffer) {
            this._buffer.push(str);
        } else {
            FS.appendFileSync(this.logFilePath, str);
        }
    }
}
