import { DeepReadonly, DeepReadonlyPartial } from '../../types/deep.js';
import { BasePair, IObjectOps, NumKey } from './types.js';

export function _getValue<T extends object, TKey extends NumKey<T> = NumKey<T>>(o: DeepReadonlyPartial<T>, key: TKey): T[TKey] | null {
    return (!o || !key) ? null : (o as T)[key];
}

export function _getInnerValue<T extends object, TKey extends string & keyof T>(o: DeepReadonly<T>, key: TKey): DeepReadonly<T[TKey]>;
export function _getInnerValue<T extends object, TKey extends string & keyof T>(o: DeepReadonly<T> | number, key: TKey): DeepReadonly<T[TKey]> | number;
export function _getInnerValue<T extends object, TKey extends keyof DeepReadonly<T>>(o: DeepReadonly<T> | number, key: TKey): DeepReadonly<T>[TKey] | number | null {
    if (typeof o === 'number') {
        return o;
    }
    if (o == null) {
        return null;
    }

    return o[key];
}


/** this helpers hides some cumbersome type transformations */
export function doOps<T extends object, TOps extends IObjectOps<any>>(
    this: void,
    ops: BasePair<T, string & keyof T, TOps>[],
    o: DeepReadonly<T>,
    processor?: (ops: TOps, value: DeepReadonly<T[string & keyof T]>, key: string & keyof T) => T[keyof T] | null,
) {
    const res = { } as T;

    const p = processor || ((ops, val) => ops.clone(val));
    ops.forEach(op => {
        res[op.key] = p(op.ops, _getInnerValue(o, op.key), op.key);
    });
    return res;
}
