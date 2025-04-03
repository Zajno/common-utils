

export async function someAsync<T>(target: ReadonlyArray<T>, condition: (v: T, index?: number, arr?: ReadonlyArray<T>) => Promise<boolean>): Promise<boolean> {
    for (let i = 0; i < target.length; ++i) {
        const ok = await condition(target[i], i, target);
        if (ok) {
            return true;
        }
    }

    return false;
}

export async function everyAsync<T>(target: ReadonlyArray<T>, condition: (v: T, index?: number, arr?: ReadonlyArray<T>) => Promise<boolean>): Promise<boolean> {
    for (let i = 0; i < target.length; ++i) {
        const ok = await condition(target[i], i, target);
        if (!ok) {
            return false;
        }
    }

    return true;
}

export async function forEachAsync<T>(target: ReadonlyArray<T>, cb: (v: T, index?: number, arr?: ReadonlyArray<T>) => Promise<void>): Promise<void> {
    for (let i = 0; i < target.length; ++i) {
        await cb(target[i], i, target);
    }
}

// The difference with Promise.all is that callbacks called sequentially
export async function mapAsync<T, R>(target: ReadonlyArray<T>, cb: (v: T, index?: number, arr?: ReadonlyArray<T>) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < target.length; ++i) {
        const r = await cb(target[i], i, target);
        results.push(r);
    }
    return results;
}
