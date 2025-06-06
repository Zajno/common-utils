import { Getter } from '../types/getter.js';
import type { ILabel, IValueModel } from './types.js';

export function withLabel<T, TModel extends IValueModel<T>, TLabel = string>(model: TModel, label: Getter<TLabel>) {
    const _label = label;
    Object.defineProperty(model, 'label', {
        configurable: true,
        enumerable: false,
        get() { return Getter.getValue(_label); },
    });

    return model as TModel & ILabel<TLabel>;
}

export function inject<T, TModel extends IValueModel<T>>(model: TModel, source: IValueModel<T>) {
    Object.defineProperty(model, 'value', {
        configurable: true,
        enumerable: false,
        get() { return source.value; },
        set(v: T) { source.value = v; },
    });

    return model;
}

/**
 * Adds callbacks to setter and getter of the 'value' property of a model. DOES NOT override previous spies (all spies are in charge).
 *
 * Useful mostly for debugging.
 * */
export function spyModel<T, TModel extends (IValueModel<T> & object)>(model: TModel, spySetter: (v: T) => void, spyGetter?: (v: T) => void) {
    const descriptor = Object.getOwnPropertyDescriptor(model, 'value');

    const valueSetter = descriptor?.set;
    const valueGetter = descriptor?.get;

    let _overrideValue: T = descriptor ? descriptor.value as T : model.value;

    Object.defineProperty(model, 'value', {
        configurable: true,
        set(v) {
            spySetter(v);
            if (valueSetter) {
                valueSetter.call(model, v);
            } else {
                _overrideValue = v as T;
            }
        },
        get() {
            let res: T | null = null;
            if (valueGetter) {
                res = valueGetter.call(model) as T;
            } else {
                res = _overrideValue;
            }
            spyGetter?.(res);
            return res;
        },
    });
}

export function wrap<TSource, TRes>(model: TSource, getter: (m: TSource) => TRes, setter: (v: TRes, model: TSource) => void): IValueModel<TRes> {
    return {
        get value() { return getter(model); },
        set value(v: TRes) { setter(v, model); },
    };
}

type LabeledModel<T, TModel extends IValueModel<T>, TLabel = string> = TModel & ILabel<TLabel>;

interface LabeledModelCtor<T, TModel extends IValueModel<T>, TLabel = string> {
    new (label?: Getter<TLabel>, initial?: T): LabeledModel<T, TModel, TLabel>;
}

export function mixinLabel<T, TModel extends IValueModel<T>, TLabel = string>(Superclass: new (initial?: T) => TModel): LabeledModelCtor<T, TModel, TLabel> {
    // @ts-expect-error -- hard to deal with this error here
    class Sub extends Superclass {
        constructor(label: Getter<TLabel>, initial?: T) {
            super(initial);
            withLabel(this, label);
        }
    }

    return Sub as LabeledModelCtor<T, TModel, TLabel>;
}
