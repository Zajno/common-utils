
export function setTimeoutAsync(ms: number, useCancel: null | ((cb: () => void) => void)= null) {
    let canceled = false;
    let _reject: null | (() => void);
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

export function timeoutPromise<T>(p: Promise<T>, timeoutMs: number, waitForMinElapsed?: number): Promise<{ resolved: T | undefined, timedOut?: boolean, elapsed: number }> {
    const started = Date.now();

    return new Promise((resolve, reject) => {
        let finished = false;
        const finish = (res: T | undefined, timedOut: boolean) => {
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

/** @deprecated Not Supported! Moved to `@zajno/common-web` package due to dependency on DOM's `requestAnimationFrame` */
export function setTimeoutFramesAsync() {
    throw new Error('setTimeoutFramesAsync has been moved to "@zajno/common-web" because it depends on "window.requestAnimationFrame".');
}
