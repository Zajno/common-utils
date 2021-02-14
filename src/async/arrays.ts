
declare global {
    interface Array<T> {
        someAsync(cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean>;
        everyAsync(cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean>;

        forEachAsync(cb: (v: T, index?: number, arr?: T[]) => Promise<void>): Promise<void>;
        mapAsync<R>(cb: (v: T, index?: number, arr?: T[]) => Promise<R>): Promise<R[]>;
    }
}

export async function someAsync<T>(this: T[], cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean> {
    for (let i = 0; i < this.length; ++i) {
        const ok = await cond(this[i], i, this);
        if (ok) {
            return true;
        }
    }

    return false;
}

export async function everyAsync<T>(this: T[], cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean> {
    for (let i = 0; i < this.length; ++i) {
        const ok = await cond(this[i], i, this);
        if (!ok) {
            return false;
        }
    }

    return true;
}

export async function forEachAsync<T>(this: T[], cb: (v: T, index?: number, arr?: T[]) => Promise<void>): Promise<void> {
    for (let i = 0; i < this.length; ++i) {
        await cb(this[i], i, this);
    }
}

export async function mapAsync<T, R>(this: T[], cb: (v: T, index?: number, arr?: T[]) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < this.length; ++i) {
        const r = await cb(this[i], i, this);
        results.push(r);
    }
    return results;
}

if (process.env.EXTEND_ARRAY_ASYNC) {
    Array.prototype.someAsync = someAsync;
    Array.prototype.everyAsync = everyAsync;
    Array.prototype.forEachAsync = forEachAsync;
    Array.prototype.mapAsync = mapAsync;
}
