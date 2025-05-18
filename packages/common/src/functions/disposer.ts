import { Loggable } from '../logger/loggable.js';
import type { ILogger } from '../logger/types.js';
import { Getter } from '../types/getter.js';
import type { Nullable } from '../types/misc.js';

export interface IDisposable {
    dispose(): void;
}

export type ISymbolDisposable = globalThis.Disposable & IDisposable;

export interface DisposeFunction {
    (): void;
}

export class Disposer extends Loggable {

    private readonly _disposers: DisposeFunction[] = [];
    private readonly _map = new Map<string, DisposeFunction>();

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
        if (log && this.logger) {
            this.logger.log(
                `Disposing ${this._disposers.length} items including named ones:`,
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

export class Disposable extends Loggable implements IDisposable {

    protected readonly disposer = new Disposer();
    protected _isDisposed = false;

    public dispose = () => {
        this._isDisposed = true;
        this.disposer.dispose();
    };

    public setLogger(logger?: Getter<Nullable<ILogger>>): this {
        this.disposer.setLogger(logger);
        return super.setLogger(logger);
    }
}

export function isDisposable(v: unknown): v is IDisposable {
    return !!v && typeof v === 'object' && 'dispose' in v && typeof v.dispose === 'function';
}

export function tryDispose(v: unknown): v is IDisposable {
    if (isDisposable(v)) {
        v.dispose();
        return true;
    }

    return false;
}
