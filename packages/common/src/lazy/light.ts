import type { IDisposable } from '../functions/disposer';
import type { IResetableModel } from '../models/types';

export type ILazy<T> = {
    readonly value: T;
    readonly hasValue: boolean;
};

export type LazyLight<T> = ILazy<T> & IDisposable & IResetableModel;

export function createLazy<T>(factory: () => T) {
    const _factory = factory;
    let _instance: T | undefined = undefined;

    const res: LazyLight<T> = {
        get value() {
            if (_instance === undefined) {
                _instance = _factory();
            }
            return _instance;
        },
        get hasValue() { return _instance !== undefined; },
        reset: () => {
            _instance = undefined;
        },
        dispose: () => res.reset(),
    };

    return res;
}
