import { AnyFunction } from './misc';

export type PropertiesOf<T> = Exclude<{
    [K in keyof T]: T[K] extends AnyFunction ? never : K
}[keyof T], undefined>;

export type RemoveFunctionFields<T> = {
    readonly [P in PropertiesOf<T>]: T[P];
};
