export * from './deep';
export * from './getter';
export * from './comparator';

export type Predicate<T> = (value: T) => boolean;

export type TypedKeys<T extends Object, K> = {
    [P in keyof T]: T[P] extends K ? P : never
}[keyof T];
