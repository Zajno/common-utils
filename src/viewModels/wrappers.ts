import { Getter } from '@zajno/common/lib/types';
import { ILabel, IValueModel } from './types';

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

export function wrap<T, TModel extends IValueModel<T>, TRes>(model: TModel, getter: (m: TModel) => TRes, setter: (v: TRes, model: TModel) => void): IValueModel<TRes> {
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
    // @ts-ignore
    class Sub extends Superclass {
        constructor(label: Getter<TLabel>, initial?: T) {
            super(initial);
            withLabel(this, label);
        }
    }

    return Sub as any;
}
