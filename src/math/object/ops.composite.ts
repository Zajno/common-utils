import { DeepReadonly } from "../../types/deep";
import { _getInnerValue, doOps } from "./helpers";
import { IObjectOps, OpsPair, OpsPairsMap } from "./types";

export class CompositeObjectOps<T extends Object> implements IObjectOps<T> {
    readonly Empty: Readonly<T>;

    private readonly _ops: OpsPair<T>[];

    constructor(innerOps: OpsPairsMap<T>) {
        this._ops = Object.entries(innerOps)
            .map(pair => ({ key: pair[0] as keyof T, ops: pair[1] }));
        this.Empty = this.getEmpty();
    }

    isEmpty(o: DeepReadonly<T>): boolean {
        return !o || this._ops.every(op => op.ops.isEmpty(_getInnerValue(o, op.key)));
    }

    getEmpty(): T {
        return doOps(this._ops, { } as DeepReadonly<T>, ops => ops.getEmpty());
    }

    clone(o: DeepReadonly<T>): T {
        return doOps(this._ops, o);
    }

    isValid(o: DeepReadonly<T>): boolean {
        return o != null && this._ops.every(op => op.ops.isValid(_getInnerValue(o, op.key)));
    }

    isEquals(a: DeepReadonly<T>, b: DeepReadonly<T>): boolean {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return this._ops.every(pair => pair.ops.isEquals(
            _getInnerValue(a, pair.key),
            _getInnerValue(b, pair.key),
        ));
    }

    assign(to: T, other: DeepReadonly<T>): void {
        this._ops.forEach(pair => {
            const val = _getInnerValue(other, pair.key);
            if (val !== undefined) {
                to[pair.key as keyof T] = val as any;
            }
        });
    }
}
