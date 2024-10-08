
export type ManualPromise<T> = {
    readonly promise: Promise<T>;
    readonly resolve: (res: T) => void;
    readonly reject: (err: Error) => void;
};

export function createManualPromise<T = void>(): ManualPromise<T> {

    let resolve: (res: T) => void;
    let reject: (err: Error) => void;

    const promise = new Promise<T>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });

    return {
        get promise() { return promise; },
        get resolve() { return resolve; },
        get reject() { return reject; },
    };
}
