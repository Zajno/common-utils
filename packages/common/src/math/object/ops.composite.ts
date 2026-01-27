import type { AnyObject, Nullable, StringKeys } from '../../types/index.js';
import type { DeepReadonly } from '../../types/deep.js';
import type { IObjectOps, OpsPair, OpsPairsMap } from './types.js';
import { _getInnerValue, doOps } from './helpers.js';

export class CompositeObjectOps<T extends AnyObject> implements IObjectOps<T> {
    readonly Empty: Readonly<T>;

    protected readonly innerOps: OpsPair<T>[];

    constructor(innerOps: OpsPairsMap<T>) {
        type TKey = StringKeys<T>;
        this.innerOps = Object.entries(innerOps)
            .map(pair => {
                const result: OpsPair<T> = {
                    key: pair[0] as TKey,
                    ops: pair[1] as IObjectOps<T[TKey]>,
                };
                return result;
            });

        this.Empty = this.getEmpty();
    }

    isEmpty(o: Nullable<DeepReadonly<T>>): boolean {
        return !o || this.innerOps.every(op => op.ops.isEmpty(_getInnerValue(o, op.key)));
    }

    getEmpty(): T {
        return doOps(this.innerOps, null, ops => ops.getEmpty());
    }

    clone(o: Nullable<DeepReadonly<T>>): T {
        return doOps(this.innerOps, o);
    }

    isValid(o: Nullable<DeepReadonly<T>>): boolean {
        return o != null && this.innerOps.every(op => op.ops.isValid(_getInnerValue(o, op.key)));
    }

    isEquals(a: Nullable<DeepReadonly<T>>, b: Nullable<DeepReadonly<T>>): boolean {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return this.innerOps.every(pair => pair.ops.isEquals(
            _getInnerValue(a, pair.key),
            _getInnerValue(b, pair.key),
        ));
    }

    assign(to: T, other: Nullable<DeepReadonly<T>>): void {
        this.innerOps.forEach(pair => {
            const val = _getInnerValue(other, pair.key);
            if (val !== undefined) {
                to[pair.key] = val;
            }
        });
    }
}
