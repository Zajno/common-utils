
export async function OptAwait<T>(cb: () => (T | Promise<T>), doAwait: boolean): Promise<T> {
    return cb && (doAwait ? (await cb()) : cb());
}

export async function chainPromises(...promises: (() => Promise<void>)[]) {

    const applyAsync = (acc: Promise<void>, val: () => Promise<void>) => acc.then(val);

    return promises.reduce(applyAsync, Promise.resolve());
}

export type ManualPromise<T> = {
    promise: Promise<T>;
    resolve: (res: T) => void;
    reject: (err: Error) => void;
};

export function createManualPromise<T = void>(): ManualPromise<T> {
    let resolve: (res: T) => void = null;
    let reject: (err: Error) => void = null;
    const promise = new Promise<T>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });

    return {
        promise,
        resolve,
        reject,
    };
}
