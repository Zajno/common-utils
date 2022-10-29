import { reaction } from 'mobx';
import { IEvent, Event } from './event';
import { ILogger, createLogger } from '../logger';
import { IDisposable } from '../functions/disposer';

export class TransitionObserver<T> implements IDisposable {

    private readonly _event = new Event<T>();
    private _getter: () => T = null;

    private _disposer: () => void;
    private _prev: T = undefined;

    private _from: T = undefined;
    private _to: T = undefined;

    private _cb: (v: T) => any;
    private _fireOnce = false;

    private _promise: Promise<T> = null;
    private _promiseReject: (err?: any) => any = null;

    private logger: ILogger = createLogger('', false);

    constructor(getter?: () => T) {
        if (getter) {
            this.observe(getter);
        }
    }

    public get event(): IEvent<T> { return this._event; }
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

    from(from: T) {
        this._from = from;
        return this;
    }

    to(to: T) {
        this._to = to;
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
            this.logger.log('started a new promise...');
        }
        return this._promise;
    }

    reverse() {
        return new TransitionObserver<T>(this._getter)
            .from(this._to)
            .to(this._from);
    }

    enableLogging(name: string) {
        this.logger = createLogger(name, name ? undefined : false);
        return this;
    }

    dispose = () => {
        this.logger.log(' disposing... ');
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

        if (this._from !== undefined && this._to !== undefined) {
            // both 'from' and 'two' should be matched
            trigger = this._prev === this._from && v === this._to;
        } else if (this._from !== undefined || this._to !== undefined) {
            // at least one match – 'from' or 'to'
            trigger = (this._from !== undefined && this._from === this._prev)
                || (this._to !== undefined && this._to === v);
        } else {
            // if both 'from' and 'to' are undefined – trigger for any change
            // this._from === undefined && this._to === undefined;
            trigger = true;
        }

        this.logger.log('Checked value:', v, ' ==> will trigger:', trigger);

        this._prev = v;

        if (trigger) {
            this._event.trigger(v);

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
