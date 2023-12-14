
export type Getter<T> = (() => T) | T;

export namespace Getter {
    export function getValue<T>(getter: Getter<T>): T {
        if (typeof getter === 'function') {
            return (getter as () => T)();
        }
        return getter;
    }
}
