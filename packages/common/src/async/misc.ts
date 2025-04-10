
export async function chainPromises(...promises: (() => Promise<void>)[]) {

    const applyAsync = (acc: Promise<void>, val: () => Promise<void>) => acc.then(val);

    return promises.reduce(applyAsync, Promise.resolve());
}
