import { SkipCondition, SkipOptions } from "../../fields/skip";
import { DeepPartial, DeepReadonly, Predicate } from "../../types";
import { _getValue } from "./helpers";
import { IObjectOps, NumKey } from "./types";

type Keys<T extends Object> = NumKey<T>[];

export class ObjectOps<T extends Object> implements IObjectOps<T> {

    public readonly Empty: Readonly<T>;

    protected _validator: Predicate<DeepReadonly<T>>;

    constructor(readonly keys: Keys<T>) {
        this.Empty = this.getEmpty();
    }

    addValidator(validator: Predicate<DeepReadonly<T>>) {
        this._validator = validator;
        return this;
    }

    getEmpty(): T {
        const result = {} as T;
        this.keys.forEach(key => {
            result[key as keyof T] = 0 as any;
        });
        return result;
    }

    clone(o: DeepReadonly<T>): T {
        return {
            ...this.getEmpty(),
            ...o,
        };
    }

    isEmpty(o: DeepReadonly<T>) {
        return !o || this.keys.every(key => !_getValue(o, key));
    }

    isValid(o: DeepReadonly<T>) {
        return o && (this._validator ? this._validator(o) : !this.isEmpty(o));
    }

    isEquals(a: DeepReadonly<T>, b: DeepReadonly<T>) {
        if (!a && !b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return this.keys.every(key => _getValue(a, key) === _getValue(b, key));
    }

    strip(v: DeepReadonly<T>, condition: SkipCondition<T, NumKey<T>> = true): DeepPartial<T> {
        const res = { } as DeepPartial<T>;
        this.keys.forEach(key => {
            const val = _getValue(v, key);
            if (SkipCondition.shouldSkip(condition, key, val)) {
                return;
            }

            res[key as keyof DeepPartial<T>] = val as any;
        });
        return res;
    }

    toStringData(v: DeepReadonly<T>, labels: Readonly<Record<Keys<T>[number], string>>, strip: SkipOptions = false): [number, string][] {
        if (!v) {
            return [];
        }

        const results = [] as [number, string][];
        this.keys
            .forEach(key => {
                if (SkipOptions.shouldSkip(_getValue(v, key), strip)) {
                    return;
                }

                const val = _getValue(v, key);
                const label = labels[key];
                results.push([val as number, label as string]);
            });

        return results;
    }

    assign(to: T, other: DeepReadonly<T>): void {
        this.keys.forEach(key => {
            const val = _getValue(other, key);
            if (val !== undefined) {
                to[key as keyof T] = val as any;
            }
        });
    }

}
