
export function setTimeoutAsync(ms: number, useCancel: (cb: () => void) => void = null) {
    let canceled = false;
    let _reject: () => void;
    let token: any;
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
