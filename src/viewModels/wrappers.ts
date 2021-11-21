import { Getter } from '../types';
import { IValueModel } from './ValuesCollector';

export interface ILabel<T> {
    readonly label: T;
}

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
