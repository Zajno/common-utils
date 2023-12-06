
export function setTimeoutAsync(ms: number, useCancel: (cb: () => void) => void = null) {
    let canceled = false;
    let _reject: () => void;
    let token: ReturnType<typeof setTimeout>;
    const res = new Promise<void>((resolve, reject) => {
        _reject = reject;
        token = setTimeout(() => {
            _reject = null;
            if (!canceled) {
                resolve();
            }
        }, ms);
    });

    if (useCancel) {
        const cancelCb = () => {
            clearTimeout(token);
            canceled = true;
            if (_reject) {
                _reject();
            }
        };
        useCancel(cancelCb);
    }

    return res;
}

/* global requestAnimationFrame */

export function setTimeoutFramesAsync(frames: number) {
    if (typeof requestAnimationFrame === 'undefined') {
        throw new Error('setTimeoutFramesAsync is not supported because "requestAnimationFrame" is not defined.');
    }

    return new Promise<void>(resolve => {
        let left = frames || 0;

        const cb = () => {
            if (--left <= 0) {
                resolve();
            } else {
                requestAnimationFrame(cb);
            }
        };

        cb();
    });
}

export function timeoutPromise<T>(p: Promise<T>, timeoutMs: number, waitForMinElapsed?: number): Promise<{ resolved: T, timedOut?: boolean, elapsed: number }> {
    const started = Date.now();

    return new Promise((resolve, reject) => {
        let finished = false;
        const finish = (res: T, timedOut: boolean) => {
            if (finished) {
                return;
            }

            finished = true;

            const getElapsed = () => (Date.now() - started);
            const doFinish = () => resolve({ resolved: res, timedOut: timedOut, elapsed: getElapsed() });

            const left = waitForMinElapsed != null ? (waitForMinElapsed - getElapsed()) : -1;
            if (left >= 0) {
                setTimeout(doFinish, left);
            } else {
                doFinish();
            }
        };

        const timeoutRef = setTimeout(() => {
            finish(undefined, true);
        }, timeoutMs);

        p.then(res => {
            clearTimeout(timeoutRef);
            finish(res, false);
        }).catch(reject);
    });
}
