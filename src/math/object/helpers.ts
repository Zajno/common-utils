import { DeepReadonly, DeepReadonlyPartial } from "../../types/deep";
import { BasePair, IObjectOps, NumKey } from "./types";

export function _getValue<T extends Object, TKey extends NumKey<T> = NumKey<T>>(o: DeepReadonlyPartial<T>, key: TKey): T[TKey] {
    return (!o || !key) ? null : (o as T)[key];
}

export function _getInnerValue<T extends Object, TKey extends keyof T>(o: DeepReadonly<T>, key: TKey): DeepReadonly<T[TKey]>;
export function _getInnerValue<T extends Object, TKey extends keyof T>(o: DeepReadonly<T> | number, key: TKey): DeepReadonly<T[TKey]> | number;
export function _getInnerValue<T extends Object, TKey extends keyof T>(o: DeepReadonly<T> | number, key: TKey): DeepReadonly<T[TKey]> | number {
    if (typeof o === 'number') {
        return o;
    }
    if (o == null) {
        return null;
    }

    return o[key] as DeepReadonly<T[TKey]>;
}


export function doOps<T extends Object, TOps extends IObjectOps<any>>(
    this: void,
    ops: BasePair<T, keyof T, TOps>[],
    o: DeepReadonly<T>,
    processor?: (ops: TOps, value: DeepReadonly<T[keyof T]>, key: keyof T) => T[keyof T],
) {
    const res = { } as T;
    const p = processor || ((ops, val) => ops.clone(val));
    ops.forEach(op => {
        res[op.key] = p(op.ops, _getInnerValue(o, op.key), op.key);
    });
    return res;
}
