import type {
    AnyObject,
    DeepReadonly,
    Nullable,
    TypedKeys,
} from '../../types/index.js';

export type NumKey<T extends AnyObject> = TypedKeys<T, number>;

export type AbsOptions = false | 'remove' | 'zero';
export type RoundOptions = 'floor' | 'ceil' | 'round';

export type DELETE_TYPE = 'delete';

export interface IObjectOps<T extends AnyObject> {
    readonly Empty: Readonly<T>;

    isEmpty(o: Nullable<DeepReadonly<T>>): boolean;
    getEmpty(): T;
    clone(o: Nullable<DeepReadonly<T>>): T;
    isValid(o: Nullable<DeepReadonly<T>>): boolean;
    isEquals(a: Nullable<DeepReadonly<T>>, b: Nullable<DeepReadonly<T>>): boolean;
    assign(to: T, other: Nullable<DeepReadonly<T>>): void;
}

export interface IObjectMath<T extends AnyObject> extends IObjectOps<T> {
    contains(base: Nullable<DeepReadonly<T>>, target: Nullable<DeepReadonly<T>>): boolean;
    inverse(o: Nullable<DeepReadonly<T>>): T;

    abs(o: Nullable<DeepReadonly<T>>, options?: AbsOptions): T | null;
    round(o: Nullable<DeepReadonly<T>>, options?: RoundOptions): T | null;

    add(o1: Nullable<DeepReadonly<T>>, o2: Nullable<DeepReadonly<T>>): T;
    subtract(base: Nullable<DeepReadonly<T>>, amount: Nullable<DeepReadonly<T> | number>): T;
    multiply(o1: Nullable<DeepReadonly<T>>, o2: Nullable<DeepReadonly<T> | number>): T;
    div(o1: Nullable<DeepReadonly<T>>, o2: Nullable<DeepReadonly<T> | number>): number;
}

export type BasePair<T extends AnyObject, TKey extends string & keyof T = string & keyof T, TOps extends IObjectOps<T[TKey]> = IObjectOps<T[TKey]>> = { key: TKey, ops: TOps };
export type OpsPair<T extends AnyObject, TKey extends string & keyof T = string & keyof T> = BasePair<T, TKey, IObjectOps<T[TKey]>>;
export type MathPair<T extends AnyObject, TKey extends string & keyof T = string & keyof T> = BasePair<T, TKey, IObjectMath<T[TKey]>>;


export type OpsPairsMap<T extends AnyObject> = {
    [K in keyof T]?: IObjectOps<T[K]>;
};

export type MathPairsMap<T extends AnyObject> = {
    [K in keyof T]?: IObjectMath<T[K]>;
};
