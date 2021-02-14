
export class Pool<T> {

    private _container: T[] = [];

    get(factory: () => T): T {
        if (this._container.length > 0) {
            return this._container.pop();
        } else {
            return factory();
        }
    }

    release(e: T): void;
    release(e: T[]): void;

    release(e: T | T[]) {
        if (Array.isArray(e)) {
            this._container.push(...e);
        } else {
            this._container.push(e);
        }
    }
}
