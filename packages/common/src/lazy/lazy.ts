import { tryDispose, type IDisposable } from '../functions/disposer.js';
import type { IResettableModel } from '../models/types.js';
import type { IExpireTracker } from '../structures/expire.js';
import type { ILazy } from './types.js';

export class Lazy<T> implements ILazy<T>, IDisposable, IResettableModel {

    protected _instance: T | undefined = undefined;
    private _expireTracker: IExpireTracker | undefined;
    private _disposer?: (prev: T) => void;
    private _error: string | null = null;

    constructor(protected readonly _factory: (() => T)) { }

    public get hasValue() { return this._instance !== undefined; }

    public get value() {
        this.ensureInstance();
        return this._instance as T;
    }

    public get currentValue() { return this._instance; }
    public get error() { return this._error; }

    /** Override me: additional way to make sure instance is valid */
    protected get isValid() {
        if (!this.hasValue) {
            return false;
        }

        if (this._expireTracker) {
            if (this._expireTracker.isExpired) {
                this.reset();
                return false;
            }
        }

        return true;
    }

    public withDisposer(disposer: (prev: T) => void) {
        this._disposer = disposer;
        return this;
    }

    public withExpire(tracker: IExpireTracker | undefined) {
        this._expireTracker = tracker;
        return this;
    }

    public prewarm() {
        this.ensureInstance();
        return this;
    }

    public setInstance(instance: T | undefined) {
        this._instance = instance;

        if (this._instance !== undefined && this._expireTracker) {
            this._expireTracker.restart();
        }
    }

    public reset() {
        if (this.hasValue && this._instance) {
            if (this._disposer) {
                this._disposer(this._instance);
            } else {
                tryDispose(this._instance);
            }
        }
        this.setInstance(undefined);
        this._error = null;
    }

    public dispose() { this.reset(); }

    private ensureInstance() {
        if (this.isValid) {
            return;
        }

        // additional reset to make sure previous instance has been disposed
        this.reset();
        try {
            const res = this._factory();
            this.setInstance(res);
        } catch (e: unknown) {
            this._error = this.parseError(e);
        }
    }

    protected parseError(err: unknown): string {
        if (typeof err === 'string') {
            return err;
        }
        if (err instanceof Error) {
            return err.message;
        }
        return String(err) || 'Unknown error';
    }
}
