import logger from '../logger/index.js';

export interface IDisposable {
    dispose(): void;
}

export type ISymbolDisposable = globalThis.Disposable & IDisposable;

export interface DisposeFunction {
    (): void;
}

export class Disposer {

    private readonly _disposers: DisposeFunction[] = [];
    private readonly _map = new Map<string, DisposeFunction>();

    private _loggerName: string | null = null;

    constructor(loggerName: string | null = null) {
        this._loggerName = loggerName;
    }

    public setLoggerName(loggerName: string) {
        this._loggerName = loggerName;
        return this;
    }

    public add(d: DisposeFunction | IDisposable, id?: string) {
        if (!d) {
            return;
        }

        const dd: DisposeFunction = typeof d !== 'function'
            ? (() => d.dispose ? d.dispose() : null)
            : d;

        this._disposers.push(dd);

        if (id) {
            // dispose previous identified disposer
            if (this._map.has(id)) {
                this.execute(id);
            }

            this._map.set(id, dd);
        }
    }

    public execute(id: string) {
        const d = this._map.get(id);
        if (!d) {
            return;
        }

        this._map.delete(id);
        const i = this._disposers.indexOf(d);
        if (i >= 0) {
            this._disposers.splice(i, 1);
        }

        d();
    }

    public dispose(log = false) {
        if (log) {
            logger.log(
                `[Disposer:${this._loggerName || '<unknown>'}] Disposing ${this._disposers.length} items including named ones:`,
                Array.from(this._map.entries()).map(e => e[0]),
            );
        }

        const copy = this._disposers.slice().reverse();
        this._disposers.length = 0;
        this._map.clear();

        // this should separate side effects
        copy.forEach(d => d());
    }
}

export function combineDisposers(...items: DisposeFunction[]): DisposeFunction {
    return () => items.forEach(i => i());
}

export class Disposable implements IDisposable {

    protected readonly disposer: Disposer;
    protected _isDisposed = false;

    constructor(loggerName: string | null = null) {
        this.disposer = new Disposer(loggerName);
    }

    public dispose = () => {
        this._isDisposed = true;
        this.disposer.dispose();
    };
}
