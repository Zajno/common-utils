import type { AnyObject, Nullable } from '../../types/index.js';
import type { DeepReadonly } from '../../types/deep.js';
import { _getInnerValue, doOps } from './helpers.js';
import { CompositeObjectOps } from './ops.composite.js';
import type { AbsOptions, IObjectMath, MathPair, MathPairsMap, RoundOptions } from './types.js';


export class CompositeObjectMath<T extends AnyObject> extends CompositeObjectOps<T> implements IObjectMath<T> {
    protected readonly innerMath: MathPair<T>[];
    private returnInfinityOnDivByEmpty = false;

    constructor(innerMath: MathPairsMap<T>) {
        super(innerMath);
        this.innerMath = Object.entries(innerMath)
            .map(pair => ({
                key: pair[0] as string & keyof T,
                ops: pair[1] as IObjectMath<T[string & keyof T]>,
            }));
    }

    useInfinityOnDivByEmpty(enable: boolean): this {
        this.returnInfinityOnDivByEmpty = enable;
        return this;
    }

    contains(base: Nullable<DeepReadonly<T>>, target: Nullable<DeepReadonly<T>>): boolean {
        if (!base) {
            return false;
        }

        if (!target) {
            return true;
        }

        return this.innerMath.every(pair => {
            const baseVal = _getInnerValue(base, pair.key);
            const targetVal = _getInnerValue(target, pair.key);
            return pair.ops.contains(baseVal, targetVal);
        });
    }

    inverse(o: Nullable<DeepReadonly<T>>): T {
        return doOps(this.innerMath, o, (ops, val) => ops.inverse(val));
    }

    abs(o: Nullable<DeepReadonly<T>>, options?: AbsOptions): T | null {
        if (!o) {
            return null;
        }
        return doOps(this.innerMath, o, (ops, val) => ops.abs(val, options));
    }

    round(o: Nullable<DeepReadonly<T>>, options?: RoundOptions): T | null {
        if (!o) {
            return null;
        }
        return doOps(this.innerMath, o, (ops, val) => ops.round(val, options));
    }

    add(o1: Nullable<DeepReadonly<T>>, o2: Nullable<DeepReadonly<T>>): T {
        return doOps(this.innerMath, o1, (ops, val, key) => ops.add(val, _getInnerValue(o2, key)));
    }

    subtract(base: Nullable<DeepReadonly<T>>, amount: number | Nullable<DeepReadonly<T>>): T {
        return doOps(
            this.innerMath,
            base,
            (ops, val, key) => ops.subtract(
                val,
                _getInnerValue(amount, key),
            ),
        );
    }

    multiply(o1: Nullable<DeepReadonly<T>>, o2: number | Nullable<DeepReadonly<T>>): T {
        return doOps(
            this.innerMath,
            o1,
            (ops, val, key) => ops.multiply(
                val,
                _getInnerValue(o2, key),
            ),
        );
    }

    div(o1: Nullable<DeepReadonly<T>>, o2: Nullable<number>): T;
    div(o1: Nullable<DeepReadonly<T>>, o2: Nullable<DeepReadonly<T>>): number;
    div(o1: Nullable<DeepReadonly<T>>, o2: Nullable<number | DeepReadonly<T>>): T | number {
        if (this.isEmpty(o1)) {
            return typeof o2 === 'number' ? this.getEmpty() : 0;
        }

        // Scalar division - divide each child by the scalar
        if (typeof o2 === 'number') {
            if (o2 === 0) {
                return this.getEmpty(); // Division by zero returns empty
            }
            return doOps(this.innerMath, o1, (ops, val) => ops.div(val, o2) as T[keyof T]);
        }

        const checkRight = <K extends AnyObject>(val: Nullable<K>, getIsEmpty: (k: Nullable<K>) => boolean) => {
            return getIsEmpty(val);
        };

        if (checkRight(o2, v => this.isEmpty(v))) {
            return this.returnInfinityOnDivByEmpty ? Number.POSITIVE_INFINITY : 0;
        }

        const results = this.innerMath.map(pair => {
            const left = _getInnerValue(o1, pair.key);
            const right = _getInnerValue(o2, pair.key);

            // Skip this field if right side is empty (can't divide by empty)
            if (checkRight(right, v => pair.ops.isEmpty(v))) {
                return null; // Mark as no valid division
            }

            // Perform division - if left is empty/zero, result will be 0
            return pair.ops.div(left, right);
        }).filter((val): val is number => val !== null); // Filter out null markers, keep zeros

        return results.length ? Math.min(...results) : 0;
    }
}
