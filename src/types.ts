export { DeepPartial } from './deepPartial';

export type DeepReadonly<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export type Getter<T> = (() => T) | T | null;

export namespace Getter {
    export function getValue<T>(getter: Getter<T>): T {
        if (getter == null) {
            return undefined;
        }
        if (typeof getter === 'function') {
            return (getter as () => T)();
        }
        return getter;
    }
}

export type Predicate<T> = (value: T) => boolean;
export type Comparator<T, C = boolean> = (v1: T, v2: T) => C;

export namespace Comparator {
    export const Default: Comparator<any> = (a, b) => a === b;
}
