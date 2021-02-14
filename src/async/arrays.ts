
declare global {
    interface Array<T> {
        someAsync(this: T[], cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean>;
        everyAsync(this: T[], cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean>;

        forEachAsync(this: T[], cb: (v: T, index?: number, arr?: T[]) => Promise<void>): Promise<void>;
        mapAsync<R>(this: T[], cb: (v: T, index?: number, arr?: T[]) => Promise<R>): Promise<R[]>;
    }
}

export async function someAsync<T>(target: T[], cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean> {
    for (let i = 0; i < target.length; ++i) {
        const ok = await cond(target[i], i, target);
        if (ok) {
            return true;
        }
    }

    return false;
}

export async function everyAsync<T>(target: T[], cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean> {
    for (let i = 0; i < target.length; ++i) {
        const ok = await cond(target[i], i, target);
        if (!ok) {
            return false;
        }
    }

    return true;
}

export async function forEachAsync<T>(target: T[], cb: (v: T, index?: number, arr?: T[]) => Promise<void>): Promise<void> {
    for (let i = 0; i < target.length; ++i) {
        await cb(target[i], i, target);
    }
}

export async function mapAsync<T, R>(target: T[], cb: (v: T, index?: number, arr?: T[]) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < target.length; ++i) {
        const r = await cb(target[i], i, target);
        results.push(r);
    }
    return results;
}

if (process.env.EXTEND_ARRAY_ASYNC) {
    Array.prototype.someAsync = function(this, ...args) { return someAsync(this, ...args); };
    Array.prototype.everyAsync = function(this, ...args) { return everyAsync(this, ...args); };
    Array.prototype.forEachAsync = function(this, ...args) { return forEachAsync(this, ...args); };
    Array.prototype.mapAsync = function(this, ...args) { return mapAsync(this, ...args); };
}
