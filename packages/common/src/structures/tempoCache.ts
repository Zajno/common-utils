
export class TempoCache<T> {

    private _expiringAt: number = 0; // already expired
    private _current: T | undefined = undefined;

    constructor(readonly factory: () => T, readonly lifetimeMs: number) { }

    public get isExpired() { return Date.now() >= this._expiringAt; }

    public get current() {
        if (this.isExpired) {
            this._current = this.factory();
            this._expiringAt = Date.now() + this.lifetimeMs;
        }
        return this._current;
    }
}
