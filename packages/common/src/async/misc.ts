
export async function OptAwait<T>(cb: () => (T | Promise<T>), doAwait: boolean): Promise<T> {
    return cb && (doAwait ? (await cb()) : cb());
}

export async function chainPromises(...promises: (() => Promise<void>)[]) {

    const applyAsync = (acc: Promise<void>, val: () => Promise<void>) => acc.then(val);

    return promises.reduce(applyAsync, Promise.resolve());
}

export * from './manualPromise.js';
