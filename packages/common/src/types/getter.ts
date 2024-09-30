
type Fn<T> = () => T;
export type Getter<T> = Fn<T> | T;

export namespace Getter {
    /** @deprecated use {@link toValue} instead */
    export function getValue<T>(getter: Getter<T>): T {
        return toValue(getter);
    }

    export function toValue<T>(getter: Getter<T>): T {
        if (typeof getter === 'function') {
            return (getter as Fn<T>)();
        }
        return getter;
    }

    export function toFn<T>(getter: Getter<T>): Fn<T> {
        if (typeof getter === 'function') {
            return getter as Fn<T>;
        }
        return () => getter;
    }
}
