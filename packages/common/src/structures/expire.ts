
export interface IExpireTracker {
    readonly isExpired: boolean;
    restart(): void;
}

export class ExpireTracker implements IExpireTracker {
    private _expiringAt: number = 0; // already expired

    constructor(public readonly lifetimeMs: number) { }

    public get isExpired() { return Date.now() >= this._expiringAt; }

    public restart() {
        this._expiringAt = Date.now() + this.lifetimeMs;
    }

    public get remainingMs() {
        return Math.max(0, this._expiringAt - Date.now());
    }

    public expire() {
        this._expiringAt = 0;
    }
}
