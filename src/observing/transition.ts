import { reaction } from 'mobx';
import { IEvent, Event } from '@zajno/common/observing/event';
import { ILogger, createLogger } from '@zajno/common/logger';
import { IDisposable } from '@zajno/common/functions/disposer';
import { Getter } from '@zajno/common/types';

export class TransitionObserver<T> implements IDisposable {

    private _event: Event<T>;
    private _getter: () => T = null;
    private _filter: (next: T, prev: T) => boolean = null;

    private _disposer: () => void;
    private _prev: T;

    private _from: Getter<T>;
    private _to: Getter<T>;

    private _cb: (v: T) => any;
    private _fireOnce = false;

    private _promise: Promise<T>;
    private _promiseReject: (err?: any) => any;

    private logger: ILogger;

    constructor(getter?: () => T) {
        if (getter) {
            this.observe(getter);
        }
    }

    public get event(): IEvent<T> {
        // lazy created just to save up some memory in case it's not needed
        if (!this._event) {
            this._event = new Event<T>(this.logger);
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

    filter(filter: (next: T, prev: T) => boolean) {
        this._filter = filter;
        return this;
    }

    cb(cb: (v: T) => any) {
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
        return this._checkValue(this._getter());
    }

    andForceCheck() {
        this.forceCheck();
        return this;
    }

    getPromise(timeout: number = null) {
        if (!this._promise) {
            if (!this.isObserving) {
                return Promise.reject(new Error('Cannot get promise for disposed TransitionObserver'));
            }

            this._promise = new Promise<T>((resolve, reject) => {
                this._promiseReject = reject;

                let timeoutHandle: any = null;
                if (timeout) {
                    timeoutHandle = setTimeout(() => {
                        this._finishPromise(this._promiseReject, new Error(`TransitionObserver Aborted – timed out after ${timeout}ms`));
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
        return new TransitionObserver<T>(this._getter)
            .from(this._to)
            .to(this._from);
    }

    enableLogging(name: string | ILogger) {
        this.logger = typeof name === 'string'
            ? createLogger(name, name ? undefined : false)
            : name;

        return this;
    }

    dispose = () => {
        this.logger?.log(' disposing... ');
        if (this._disposer) {
            this._disposer();
            this._disposer = null;
        }
        if (this.isPromising) {
            this._finishPromise(this._promiseReject, new Error('TransitionObserver Aborted'));
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

    private _finishPromise<T>(cb: (a?: T) => any, arg?: T) {
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
