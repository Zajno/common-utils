import { DeepReadonly, TypedKeys } from '../../types';

export type NumKey<T> = TypedKeys<T, number>;

export type AbsOptions = false | 'remove' | 'zero';
export type RoundOptions = 'floor' | 'ceil' | 'round';

export type DELETE_TYPE = 'delete';

export interface IObjectOps<T extends Object> {
    readonly Empty: Readonly<T>;

    isEmpty(o: DeepReadonly<T>): boolean;
    getEmpty(): T;
    clone(o: DeepReadonly<T>): T;
    isValid(o: DeepReadonly<T>): boolean;
    isEquals(a: DeepReadonly<T>, b: DeepReadonly<T>): boolean;
    assign(to: T, other: DeepReadonly<T>): void;
}

export interface IObjectMath<T extends Object> extends IObjectOps<T> {
    contains(base: DeepReadonly<T>, target: DeepReadonly<T>): boolean;
    inverse(o: DeepReadonly<T>): T;

    abs(o: DeepReadonly<T>, options?: AbsOptions): T;
    round(o: DeepReadonly<T>, options?: RoundOptions): T;

    add(o1: DeepReadonly<T>, o2: DeepReadonly<T>): T;
    subtract(base: DeepReadonly<T>, amount: DeepReadonly<T> | number): T;
    multiply(o1: DeepReadonly<T>, o2: DeepReadonly<T> | number): T;
    div(o1: DeepReadonly<T>, o2: DeepReadonly<T> | number): number;
}


export type BasePair<T extends Object, TKey extends keyof T = keyof T, TOps extends IObjectOps<T[TKey]> = IObjectOps<T[TKey]>> = { key: TKey, ops: TOps };
export type OpsPair<T extends Object, TKey extends keyof T = keyof T> = BasePair<T, TKey, IObjectOps<T[TKey]>>;
export type MathPair<T extends Object, TKey extends keyof T = keyof T> = BasePair<T, TKey, IObjectMath<T[TKey]>>;


export type OpsPairsMap<T extends Object> = {
    [K in keyof T]?: IObjectOps<T[K]>;
};

export type MathPairsMap<T extends Object> = {
    [K in keyof T]?: IObjectMath<T[K]>;
};
