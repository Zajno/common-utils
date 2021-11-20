export { DeepPartial } from './deepPartial';

export type DeepReadonly<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};

export type Getter<T> = (() => T) | T | null;

export namespace Getter {
    export function getValue<T>(getter: Getter<T>): T {
        if (getter == null) {
            return null;
        }
        if (typeof getter === 'function') {
            return (getter as () => T)();
        }
        return getter;
    }
}

export type Predicate<T> = (value: T) => boolean;
