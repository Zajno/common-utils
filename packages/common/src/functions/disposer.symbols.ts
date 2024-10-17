import type { IDisposable } from './disposer.js';

// Symbol.dispose ??= Symbol('Symbol.dispose');
if (!('dispose' in Symbol)) {
    // @ts-expect-error polyfill for Symbol.dispose
    Symbol.dispose = Symbol('Symbol.dispose');
}

// Symbol.asyncDispose ??= Symbol('Symbol.asyncDispose');
if (!('asyncDispose' in Symbol)) {
    // @ts-expect-error polyfill for Symbol.asyncDispose
    Symbol.asyncDispose = Symbol('Symbol.asyncDispose');
}

// for demonstration purposes, but use as base class if needed
export abstract class SymbolDisposable implements globalThis.Disposable, IDisposable {

    [Symbol.dispose] = () => this.dispose();

    abstract dispose(): void;
}


export function makeSymbolDisposable<T extends IDisposable>(obj: T): T & SymbolDisposable {
    const fn = () => obj.dispose();

    Object.defineProperty(
        obj,
        Symbol.dispose,
        {
            get() {
                return fn;
            },
        },
    );

    return obj as T & SymbolDisposable;
}
