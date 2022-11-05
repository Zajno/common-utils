
export async function OptAwait<T>(cb: () => (T | Promise<T>), doAwait: boolean): Promise<T> {
    return cb && (doAwait ? (await cb()) : cb());
}

export async function chain(...promises: (() => Promise<void>)[]) {

    const applyAsync = (acc: Promise<void>, val: () => Promise<void>) => acc.then(val);

    return promises.reduce(applyAsync, Promise.resolve());
}
