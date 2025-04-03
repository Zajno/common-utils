
export interface IValueModelReadonly<TValue> {
    readonly value: TValue;
}

export interface IValueModel<TValue> extends IValueModelReadonly<TValue> {
    value: TValue;
}

export interface ILabel<T> {
    readonly label: T;
}

export interface IResetableModel {
    readonly reset: () => void;
    readonly isDefault?: boolean;
}

export interface IFocusableModel {
    focused: boolean;
}

export interface IErrorModel {
    readonly error: string;
}

export interface ICountableModel {
    readonly count: number;
    readonly selectedCount?: number;
    readonly isEmpty: boolean;
}

/** Lighter version of ES2015 Map with no constructor/symbols stuff. */
export type IMapModel<K, V> = Pick<
    Map<K, V>,
    | 'clear'
    | 'delete'
    | 'get'
    | 'has'
    | 'set'
    | 'size'
    | 'entries'
    | 'keys'
    | 'values'
    | 'forEach'
>;
