import { LazyPromise } from '../lazy/promise.js';
import type { AnyObject, FunctionKeys, StringKeys } from '../types/index.js';

const PromiseGetter = '__promise';

type AllowedFnKeys<T extends AnyObject> = FunctionKeys<T, any[], void>;

type PromiseProxy<T extends AnyObject, TKeys extends StringKeys<T> = StringKeys<T>, TFnKeys = never, TWrap extends object = object> = {
    [K in TKeys]: T[K] extends (...args: any) => any
        ? (K extends TFnKeys ? T[K] : never)
        : T[K];
} & {
    readonly [PromiseGetter]: Promise<T>;
} & TWrap;

type ForbiddenKeys = typeof PromiseGetter;
type NoForbiddenKeys<T> = {
    [K in keyof T]: K extends ForbiddenKeys ? never : T[K];
};

interface LazyPromiseCtor<K> {
    new (loader: () => Promise<K>): LazyPromise<K>;
}

type Options<T, TFnKeys, TWrap, TLazy extends LazyPromiseCtor<T>> = {
    /** Function returning a promise that resolves to a proxied object */
    loader: () => Promise<T>;

    /** An array of keys that should be treated as functions so that they can be called before the object is resolved */
    fnKeys?: TFnKeys[];

    /** An object that will be used as a wrapper for the proxied object. Can contain any fields that will be copied to the resolved object */
    wrap?: TWrap;

    /** A constructor that creates {@link {LazyPromise}} instance for handling loader */
    lazy?: TLazy;
};

/**
 * Creates a proxy object that will be resolved to the object returned by the loader function.
 * @param options - Options for creating the proxy, see {@link Options}
 * @returns a proxy object that will be resolved to the object returned by the loader function
 */
export function createPromiseProxy<T extends NoForbiddenKeys<T>, TFnKeys extends AllowedFnKeys<T> = never, TWrap extends object = object>(
    options: Options<T, TFnKeys, TWrap, typeof LazyPromise>,
): PromiseProxy<T, StringKeys<T>, TFnKeys, TWrap> {
    const { loader, fnKeys, wrap, lazy: TLazy = LazyPromise } = options;

    // wrapper object that will hold values temporarily while loading is in progress
    const wrapper = (wrap || { }) as Partial<PromiseProxy<T>>;
    const functionCalls = new Map<TFnKeys, any[]>();

    let _resolved: T | null = null;

    let lazy = new TLazy(async () => {
        // do the loading
        const result: T = await loader();
        // copy values from wrapper to result
        Object.entries(wrapper).forEach(([key, value]) => {
            const kk = key as keyof typeof wrap;
            if (value !== undefined && (!wrap || wrap[kk] == null)) {
                result[key as keyof T] = value as T[keyof T];
            }
        });
        // call functions that were called before the object was resolved
        for (const [key, args] of functionCalls) {
            const fn = result[key] as (...args: any[]) => void;
            fn.apply(result, args);
        }

        _resolved = result;
        if (_resolved) {
            // free up memory, we don't need the wrapper anymore
            lazy = null as any;
        }
        return result;
    });

    const proxy = new Proxy(wrapper, {
        get(target, key) {
            if (key === PromiseGetter) {
                return _resolved ? null : lazy.promise;
            }

            const current = _resolved || lazy.value;
            if (current) {
                if (wrap && !(key in current) && key in wrap) {
                    return target[key as keyof typeof target];
                }
                const res = current[key as keyof typeof current];
                if (typeof res === 'function') {
                    return (res as () => any).bind(current);
                }
                return res;
            }

            if (fnKeys?.includes(key as TFnKeys)) {
                return (...args: any[]) => {
                    functionCalls.set(key as TFnKeys, args);
                };
            }

            return target[key as keyof typeof target];
        },
        set(target, key, value): boolean {
            const current = _resolved || lazy.value;
            if (current) {
                current[key as keyof typeof current] = value;
            } else {
                target[key as keyof typeof target] = value;
            }
            return true;
        },
        getOwnPropertyDescriptor(target, key) {
            const current = _resolved || lazy.value;
            if (current) {
                return Object.getOwnPropertyDescriptor(current, key);
            }
            return Object.getOwnPropertyDescriptor(target, key);
        },
        ownKeys(target) {
            const current = _resolved || lazy.value;
            if (current) {
                return Object.keys(current);
            }
            return Object.keys(target);
        },
    });

    return proxy as PromiseProxy<T, StringKeys<T>, TFnKeys, TWrap>;
}
