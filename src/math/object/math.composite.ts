import { DeepReadonly } from '../../types/deep';
import { _getInnerValue, doOps } from './helpers';
import { CompositeObjectOps } from './ops.composite';
import { AbsOptions, IObjectMath, MathPair, MathPairsMap, RoundOptions } from './types';


export class CompositeObjectMath<T extends Object> extends CompositeObjectOps<T> implements IObjectMath<T> {
    private readonly _math: MathPair<T>[];

    constructor(innerMath: MathPairsMap<T>) {
        super(innerMath);
        this._math = Object.entries(innerMath)
            .map(pair => ({ key: pair[0] as keyof T, ops: pair[1] }));
    }

    contains(base: DeepReadonly<T>, target: DeepReadonly<T>): boolean {
        if (!base || !target) {
            return false;
        }

        return this._math.every(pair => {
            const baseVal = _getInnerValue(base, pair.key);
            const targetVal = _getInnerValue(target, pair.key);
            return pair.ops.contains(baseVal, targetVal);
        });
    }

    inverse(o: DeepReadonly<T>): T {
        return doOps(this._math, o, (ops, val) => ops.inverse(val));
    }

    abs(o: DeepReadonly<T>, options?: AbsOptions): T {
        return doOps(this._math, o, (ops, val) => ops.abs(val, options));
    }

    round(o: DeepReadonly<T>, options?: RoundOptions): T {
        return doOps(this._math, o, (ops, val) => ops.round(val, options));
    }

    add(o1: DeepReadonly<T>, o2: DeepReadonly<T>): T {
        if (this.isEmpty(o1) && this.isEmpty(o2)) {
            return this.getEmpty();
        }

        return doOps(this._math, o1, (ops, val, key) => ops.add(val, _getInnerValue(o2, key)));
    }

    subtract(base: DeepReadonly<T>, amount: number | DeepReadonly<T>): T {
        return doOps(
            this._math,
            base,
            (ops, val, key) => ops.subtract(
                val,
                _getInnerValue(amount, key),
            ),
        );
    }

    multiply(o1: DeepReadonly<T>, o2: number | DeepReadonly<T>): T {
        return doOps(
            this._math,
            o1,
            (ops, val, key) => ops.multiply(
                val,
                _getInnerValue(o2, key),
            ),
        );
    }

    div(o1: DeepReadonly<T>, o2: number | DeepReadonly<T>): number {
        if (this.isEmpty(o1)) {
            return 0;
        }

        if (typeof o2 === 'number' && o2 === 0 || typeof o2 !== 'number' && this.isEmpty(o2)) {
            return Number.POSITIVE_INFINITY;
        }

        const vals = this._math.map(pair => {
            const val = _getInnerValue(o1, pair.key);
            return pair.ops.div(val, _getInnerValue(o2, pair.key));
        }).filter(Boolean);

        return Math.min(...vals);
    }
}
