
export type Comparator<T, C = boolean> = (v1: T, v2: T) => C;

export namespace Comparator {
    export const Default: Comparator<any> = (a, b) => a === b;
}
