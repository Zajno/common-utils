import type { IDisposable } from '../functions/disposer.js';
import type { IResetableModel } from '../models/types.js';
import type { ILazy } from './types.js';

export function createLazy<T>(factory: () => T) {
    const _factory = factory;
    let _instance: T | undefined = undefined;

    const res: ILazy<T> & IDisposable & IResetableModel = {
        get value() {
            if (_instance === undefined) {
                _instance = _factory();
            }
            return _instance;
        },
        get currentValue() { return _instance; },
        get hasValue() { return _instance !== undefined; },
        reset: () => {
            _instance = undefined;
        },
        dispose: () => res.reset(),
    };

    return res;
}
