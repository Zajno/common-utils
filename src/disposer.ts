import logger from './logger';

export interface IDisposable {
    dispose(): void;
}

export interface DisposeFunction {
    (): void;
}

export class Disposer {

    private readonly _disposers: DisposeFunction[] = [];
    private readonly _map = new Map<string, DisposeFunction>();

    constructor(readonly logName: string = null) { }

    add(d: DisposeFunction | IDisposable, id?: string) {
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

    execute(id: string) {
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

    dispose(log = false) {
        if (log) {
            logger.log(
                `[Disposer:${this.logName || '<unknown>'}] Disposing ${this._disposers.length} items including named ones:`,
                Array.from(this._map.entries()).map(e => e[0]),
            );
        }

        this._disposers.forEach(d => d());
        this._disposers.length = 0;
        this._map.clear();
    }
}

export function combineDisposers(...items: DisposeFunction[]): DisposeFunction {
    return () => items.forEach(i => i());
}

export class Disposable implements IDisposable {

    protected readonly disposer = new Disposer();
    protected _isDisposed = false;

    public dispose = () => {
        this._isDisposed = true;
        this.disposer.dispose();
    };
}
