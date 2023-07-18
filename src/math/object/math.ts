import { TypedKeys } from "../../types";
import { DeepReadonly, DeepReadonlyPartial } from "../../types/deep";
import { _getValue } from "./helpers";
import { ObjectOps } from "./ops";
import { AbsOptions, DELETE_TYPE, IObjectMath, NumKey, RoundOptions } from "./types";

type NumVal<T extends Object> = T[NumKey<T>];

const DELETE: DELETE_TYPE = 'delete';

export class ObjectMath<T extends Object> extends ObjectOps<T> implements IObjectMath<T> {

    getTotal(o: DeepReadonlyPartial<T>) {
        let sum = 0;
        if (o) {
            this.keys.forEach(key => {
                const v = _getValue(o, key) as number;
                sum += v || 0;
            });
        }
        return sum;
    }

    contains(base: DeepReadonly<T>, target: DeepReadonly<T>) {
        return this.keys.every(key => {
            const baseVal = _getValue(base, key) as number || 0;
            const targetVal = _getValue(target, key) as number || 0;
            return baseVal >= targetVal;
        });
    }

    inverse(o: DeepReadonly<T>): T {
        return this.multiply(o, -1);
    }

    div(o1: DeepReadonly<T>, o2: number): T;
    div(o1: DeepReadonly<T>, o2: DeepReadonly<T>): number;
    div(o1: DeepReadonly<T>, o2: DeepReadonly<T> | number): T | number {
        if (!o1 || !o2) {
            return 0;
        }

        if (typeof o2 === 'number') {
            const res = { } as T;
            Object.keys(o1).forEach(key => {
                res[key] = Math.round(o1[key] / o2);
            });
            return res;
        }

        let min: number = null;
        Object.keys(o2).forEach(key => {
            const v: number = o2[key];
            if (!v) {
                return;
            }

            const b = o1[key] || 0;
            const c = Math.round(b / v);
            if (min == null || c < min) {
                min = c;
            }
        });
        return min;
    }

    process(o: DeepReadonly<T>, processor: (val: number, key: NumKey<T>) => number | DELETE_TYPE): T {
        if (!o) {
            return null;
        }

        const res = this.clone(o);
        this.keys.forEach(k => {
            const current = _getValue(o, k) as number;
            const r = processor(current, k);
            if (r === DELETE) {
                delete res[k];
                return;
            }

            res[k] = r as T[TypedKeys<T, number>]; // number
        });
        return res;
    }

    abs(c: DeepReadonly<T>, stripNegatives: AbsOptions = false): T {
        return this.process(c, (val) => {
            if (val >= 0) {
                return val;
            }

            if (stripNegatives === 'remove') {
                return DELETE;
            }

            let r = 0;
            if (stripNegatives === 'zero') {
                r = 0;
            } else {
                r = -1 * val;
            }
            return r;
        });
    }


    round(c: DeepReadonly<T>, method: RoundOptions = 'round') {
        return this.process(c, (val) => {
            switch (method) {
                case 'round':
                    return Math.round(val);
                case 'floor':
                    return Math.floor(val);
                case 'ceil':
                    return Math.ceil(val);
                default:
                    return val;
            }
        });
    }

    calc(c1: DeepReadonly<T>, c2: DeepReadonly<T> | number, operator: (n: number, n2: number) => number) {
        const result = this.clone(c1);
        this.keys.forEach(k => {
            const l = _getValue(c1, k) as number;
            const r = typeof c2 === 'number' ? c2 : (_getValue(c2, k) as number);
            type NewType = NumVal<T>;

            result[k] = operator(l || 0, r || 0) as NewType;
        });
        return result;
    }

    add(c1: DeepReadonly<T>, c2: DeepReadonly<T> | number) {
        return this.calc(c1, c2, (n1, n2) => (n1 || 0) + (n2 || 0));
    }

    subtract(base: DeepReadonly<T>, amount: DeepReadonly<T> | number) {
        return this.calc(base, amount, (n1, n2) => (n1 || 0) - (n2 || 0));
    }

    multiply(c1: DeepReadonly<T>, c2: DeepReadonly<T> | number) {
        return this.calc(c1, c2, (n1, n2) => (n1 || 0) * (n2 || 0));
    }
}
