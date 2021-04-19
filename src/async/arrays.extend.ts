import { someAsync, everyAsync, forEachAsync, mapAsync } from './arrays';

declare global {
    interface Array<T> {
        someAsync(this: T[], cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean>;
        everyAsync(this: T[], cond: (v: T, index?: number, arr?: T[]) => Promise<boolean>): Promise<boolean>;

        forEachAsync(this: T[], cb: (v: T, index?: number, arr?: T[]) => Promise<void>): Promise<void>;
        mapAsync<R>(this: T[], cb: (v: T, index?: number, arr?: T[]) => Promise<R>): Promise<R[]>;
    }
}


Array.prototype.someAsync = function(this, ...args) { return someAsync(this, ...args); };
Array.prototype.everyAsync = function(this, ...args) { return everyAsync(this, ...args); };
Array.prototype.forEachAsync = function(this, ...args) { return forEachAsync(this, ...args); };
Array.prototype.mapAsync = function(this, ...args) { return mapAsync(this, ...args); };
