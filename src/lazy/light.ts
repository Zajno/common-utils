import type { IDisposable } from '../functions/disposer';

export type LazyLight<T> = IDisposable & {
    readonly value: T;
    readonly hasValue: boolean;

    reset(): void;
};

export function createLazy<T>(factory: () => T) {
    const _factory = factory;
    let _instance: T = undefined;

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
