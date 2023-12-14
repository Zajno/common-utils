import type { IDisposable } from '../functions/disposer';

export class Pool<T> {

    private readonly _container: T[] = [];

    constructor(readonly factory: () => T) { }

    public get(): T {
        if (this._container.length > 0) {
            return this._container.pop()!;
        } else {
            return this.factory();
        }
    }

    public release(e: T | T[]): void {
        if (Array.isArray(e)) {
            this._container.push(...e);
        } else if (e) {
            this._container.push(e);
        }
    }
}

type Initializer<T> = (item: T) => void;

export class PoolDisposable<T extends IDisposable> extends Pool<T> {

    constructor(factory: () => T, readonly initializer: null | Initializer<T> = null) {
        super(factory);
    }

    public get(): T {
        const res = super.get();
        this.initializer?.(res);
        return res;
    }

    public release(e: T | T[]): void {
        if (Array.isArray(e)) {
            e.forEach(ee => ee.dispose());
        } else if (e) {
            e.dispose();
        }
        return super.release(e);
    }
}
