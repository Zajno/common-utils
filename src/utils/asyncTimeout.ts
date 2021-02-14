
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
