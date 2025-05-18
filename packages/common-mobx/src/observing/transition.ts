import { reaction } from 'mobx';
import { type IEvent, Event } from '@zajno/common/observing/event';
import type { DisposeFunction, IDisposable } from '@zajno/common/functions/disposer';
import { Getter } from '@zajno/common/types/getter';
import type { Nullable } from '@zajno/common/types/misc';
import { Loggable } from '@zajno/common/logger';

export class TransitionObserver<T> extends Loggable implements IDisposable {

    private _event: Nullable<Event<T>>;
    private _getter: null | (() => T) = null;
    private _filter: null | ((next: T, prev: Nullable<T>) => boolean) = null;

    private _disposer: undefined | DisposeFunction;
    private _prev: Nullable<T>;

    private _from: Nullable<Getter<T>>;
    private _to: Nullable<Getter<T>>;

    private _cb: Nullable<(v: Nullable<T>) => any>;
    private _fireOnce = false;

    private _promise: Nullable<Promise<Nullable<T>>>;
    private _promiseReject: Nullable<((err?: any) => any)>;

    constructor(getter?: () => T) {
        super();
        if (getter) {
            this.observe(getter);
        }
    }

    public get event(): IEvent<T> {
        // lazy created just to save up some memory in case it's not needed
        if (!this._event) {
            this._event = new Event<T>().setLogger(this.logger);
        }
        return this._event;
    }
    public get currentValue() { return this._prev; }

    public get isObserving() { return this._disposer != null; }
    private get isPromising() { return this._promiseReject != null; }

    observe(getter: () => T) {
        this.dispose();
        this._getter = getter;
        this._prev = this._getter();
        this._disposer = reaction(this._getter, this._checkValue);
        return this;
    }

    from(from: Getter<T>) {
        this._from = from;
        return this;
    }

    to(to: Getter<T>) {
        this._to = to;
        return this;
    }

    filter(filter: (next: T, prev: Nullable<T>) => boolean) {
        this._filter = filter;
        return this;
    }

    cb(cb: (v: Nullable<T>) => any) {
        if (this.isPromising) {
            throw new Error('Cannot set callback when promise is running');
        }
        this._cb = cb;
        return this;
    }

    forceCall() {
        if (this._cb) {
            this._cb(this._prev);
        }
        return this;
    }

    fireOnce(enable = true) {
        this._fireOnce = enable;
        return this;
    }

    forceCheck() {
        if (!this._getter) {
            return false;
        }

        return this._checkValue(this._getter());
    }

    andForceCheck() {
        this.forceCheck();
        return this;
    }

    getPromise(timeout: number | null = null) {
        if (this._promise == null) {
            if (!this.isObserving) {
                return Promise.reject(new Error('Cannot get promise for disposed TransitionObserver'));
            }

            this._promise = new Promise<Nullable<T>>((resolve, reject) => {
                this._promiseReject = reject;

                let timeoutHandle: any = null;
                if (timeout) {
                    timeoutHandle = setTimeout(() => {
                        this._finishPromise(reject, new Error(`TransitionObserver Aborted – timed out after ${timeout}ms`));
                    }, timeout);
                }

                this._cb = (v => {
                    clearTimeout(timeoutHandle);
                    this._finishPromise(resolve, v);
                });
                this.forceCheck();
            });
            this.logger?.log('started a new promise...');
        }
        return this._promise;
    }

    reverse() {
        if (!this._getter) {
            throw new Error('Cannot reverse TransitionObserver without getter being set');
        }

        return new TransitionObserver<T>(this._getter)
            .from(this._to!)
            .to(this._from!);
    }

    dispose = () => {
        this.logger?.log(' disposing... ');
        if (this._disposer) {
            this._disposer();
            this._disposer = undefined;
        }
        if (this.isPromising) {
            this._finishPromise(this._promiseReject ?? (() => { /* no-op */ }), new Error('TransitionObserver Aborted'));
        }
    };

    private _checkValue = (v: T) => {
        let trigger = false;

        const from = Getter.getValue(this._from);
        const to = Getter.getValue(this._to);

        if (this._filter && !this._filter(v, this._prev)) {
            trigger = false;
        } else if (from !== undefined && to !== undefined) {
            // both 'from' and 'two' should be matched
            trigger = this._prev === from && v === to;
        } else if (from !== undefined || to !== undefined) {
            // at least one match – 'from' or 'to'
            trigger = (from !== undefined && from === this._prev)
                || (to !== undefined && to === v);
        } else {
            // if both 'from' and 'to' are undefined – trigger for any change
            // this._from === undefined && this._to === undefined;
            trigger = true;
        }

        this.logger?.log('Checked value:', v, ' ==> will trigger:', trigger);

        this._prev = v;

        if (trigger) {
            // will actually trigger only if someone subscribed to the event
            // Use triggerAsync to catch and log all errors
            this._event?.triggerAsync(v);

            if (this._cb) {
                this._cb(v);
            }

            if (this._fireOnce) {
                this.dispose();
            }
        }

        return trigger;
    };

    private _finishPromise<T>(cb: null | ((a?: T) => any), arg?: T) {
        this._promise = null;
        this._promiseReject = null;
        this._cb = null;
        if (cb) {
            cb(arg);
        }
    }
}

export function waitFor<T>(current: () => T, toBe: T) {
    return new TransitionObserver(current)
        .to(toBe)
        .fireOnce()
        .getPromise();
}
