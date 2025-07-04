import type { AnyObject, Nullable } from '../../types/index.js';
import type { DeepReadonly } from '../../types/deep.js';
import { _getInnerValue, doOps } from './helpers.js';
import { CompositeObjectOps } from './ops.composite.js';
import type { AbsOptions, IObjectMath, MathPair, MathPairsMap, RoundOptions } from './types.js';


export class CompositeObjectMath<T extends AnyObject> extends CompositeObjectOps<T> implements IObjectMath<T> {
    private readonly _math: MathPair<T>[];

    constructor(innerMath: MathPairsMap<T>) {
        super(innerMath);
        this._math = Object.entries(innerMath)
            .map(pair => ({
                key: pair[0] as string & keyof T,
                ops: pair[1] as IObjectMath<T[string & keyof T]>,
            }));
    }

    contains(base: Nullable<DeepReadonly<T>>, target: Nullable<DeepReadonly<T>>): boolean {
        if (!base || !target) {
            return false;
        }

        return this._math.every(pair => {
            const baseVal = _getInnerValue(base, pair.key);
            const targetVal = _getInnerValue(target, pair.key);
            return pair.ops.contains(baseVal, targetVal);
        });
    }

    inverse(o: Nullable<DeepReadonly<T>>): T {
        return doOps(this._math, o, (ops, val) => ops.inverse(val));
    }

    abs(o: Nullable<DeepReadonly<T>>, options?: AbsOptions): T | null {
        return doOps(this._math, o, (ops, val) => ops.abs(val, options));
    }

    round(o: Nullable<DeepReadonly<T>>, options?: RoundOptions): T {
        return doOps(this._math, o, (ops, val) => ops.round(val, options));
    }

    add(o1: Nullable<DeepReadonly<T>>, o2: Nullable<DeepReadonly<T>>): T {
        if (this.isEmpty(o1) && this.isEmpty(o2)) {
            return this.getEmpty();
        }

        return doOps(this._math, o1, (ops, val, key) => ops.add(val, _getInnerValue(o2, key)));
    }

    subtract(base: Nullable<DeepReadonly<T>>, amount: number | Nullable<DeepReadonly<T>>): T {
        return doOps(
            this._math,
            base,
            (ops, val, key) => ops.subtract(
                val,
                _getInnerValue(amount, key),
            ),
        );
    }

    multiply(o1: Nullable<DeepReadonly<T>>, o2: number | Nullable<DeepReadonly<T>>): T {
        return doOps(
            this._math,
            o1,
            (ops, val, key) => ops.multiply(
                val,
                _getInnerValue(o2, key),
            ),
        );
    }

    div(o1: Nullable<DeepReadonly<T>>, o2: Nullable<number | DeepReadonly<T>>): number {
        if (this.isEmpty(o1)) {
            return 0;
        }

        const checkRight = <K extends AnyObject>(val: Nullable<number | K>, getIsEmpty: (k: Nullable<K>) => boolean) => {
            return typeof val === 'number' && val === 0 || typeof val !== 'number' && getIsEmpty(val);
        };

        if (checkRight(o2, v => this.isEmpty(v))) {
            return Number.POSITIVE_INFINITY;
        }

        const results = this._math.map(pair => {
            const left = _getInnerValue(o1, pair.key);
            if (pair.ops.isEmpty(left)) {
                return 0;
            }

            const right = _getInnerValue(o2, pair.key);

            if (checkRight(right, v => pair.ops.isEmpty(v))) {
                return 0;
            }

            return pair.ops.div(left, right);
        }).filter(Boolean);

        return results.length ? Math.min(...results) : 0;
    }
}
