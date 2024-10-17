import { Nullable } from '../types/index.js';

export type LogTypes<TIn = any, TOut = any> = boolean | 'full' | LogTypes.Dir | {
    req?: boolean | LogTypes.LogFn<TIn>;
    res?: boolean | LogTypes.LogFn<TOut>;
};

export namespace LogTypes {
    export type Dir = 'req' | 'res';
    export type LogFn<T = any> = (data: T) => void | string | any[];

    export function getIsEnabled<T = unknown>(type: Nullable<LogTypes>, dir: Dir): { enabled: boolean, formatter?: Nullable<(data: T) => unknown> } {
        if (type) {
            if (type === true || type === 'full' || type === dir) {
                return { enabled: true };
            }

            if (typeof type === 'object') {
                const log = type[dir];
                if (log === true) {
                    return { enabled: true };
                }

                if (typeof log === 'function') {
                    return {
                        enabled: true,
                        formatter: log,
                    };
                }
            }
        }

        return { enabled: false };
    }

}
