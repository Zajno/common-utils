import type { ILazy } from './types';

export function createLazy<T>(factory: () => T) {
    const _factory = factory;
    let _instance: T | undefined = undefined;

    const res: ILazy<T> = {
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
