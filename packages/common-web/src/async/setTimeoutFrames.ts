
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
