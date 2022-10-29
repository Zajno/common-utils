import logger from '../logger';

export class ThrottleAction<T = any> {

    private _timeoutRef: any = null;
    private _postponedCb: () => (T | Promise<T>) = null;
    private _locked = false;

    private _resolvers: (() => void)[] = [];

    constructor(public timeout = 1000) {}

    clear() {
        clearTimeout(this._timeoutRef);
        this._timeoutRef = null;
        this._postponedCb = null;
    }

    tryRun(cb: () => T | Promise<T>, restartTimeout = false) {
        if (!this._timeoutRef) {
            this._postponedCb = cb;
            this._timeoutRef = setTimeout(this.forceRun, this.timeout);
            // logger.log('THROTTLE setTimeout', this.timeout);
        } else if (restartTimeout) {
            this.clear();
            this.tryRun(cb);
        }
    }

    forceRun = async () => {
        const cb = this._postponedCb;
        this.clear();

        if (this._locked) {
            logger.warn('THROTTLE LOCKED');
        } else if (cb) {
            try {
                this._locked = true;
                return await cb();
            } finally {
                this._locked = false;

                const resolvers = this._resolvers.slice();
                this._resolvers.length = 0;
                // logger.log('getPromise: resolving', resolvers.length);
                resolvers.forEach(r => r());
            }
        }
    };

    getPromise() {
        if (!this._locked && !this._timeoutRef) {
            // logger.log('getPromise: nothing to wait for');
            return Promise.resolve();
        }

        return new Promise<void>(resolve => {
            // logger.log('getPromise: adding resolver');
            this._resolvers.push(resolve);
        });
    }
}

export class ThrottleProcessor<TSubject> {

    private readonly _queue: TSubject[] = [];
    private readonly _action: ThrottleAction = null;

    constructor(readonly process: (objs: TSubject[]) => Promise<any>, timeout = 1000) {
        if (!process) {
            throw new Error('Arg0 expected: process');
        }

        this._action = new ThrottleAction(timeout);
    }

    push(data: TSubject) {
        this._queue.push(data);

        this._action.tryRun(this._process, true);
    }

    private _process = async () => {
        if (!this._queue.length) {
            return;
        }

        const objs = this._queue.slice();
        this._queue.length = 0;
        await this.process(objs);
    };

    clear() {
        this._action.clear();
    }
}
