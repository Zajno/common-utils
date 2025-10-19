import type { IDisposable } from '../functions/disposer.js';
import type { IResettableModel } from '../models/types.js';
import type { ILazy } from './types.js';

export function createLazy<T>(factory: () => T) {
    const _factory = factory;
    let _instance: T | undefined = undefined;
    let _error: string | null = null;

    const res: ILazy<T> & IDisposable & IResettableModel = {
        get value() {
            if (_instance === undefined) {
                _error = null;
                try {
                    _instance = _factory();
                } catch (e: unknown) {
                    _error = e instanceof Error ? e.message : String(e);
                    throw e;
                }
            }
            return _instance;
        },
        get currentValue() { return _instance; },
        get hasValue() { return _instance !== undefined; },
        get error() { return _error; },
        reset: () => {
            _instance = undefined;
            _error = null;
        },
        dispose: () => res.reset(),
    };

    return res;
}
