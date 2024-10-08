import type { IResetableModel, IValueModel } from './types';
import { Getter } from '../types/getter';
import { Nullable } from '../types/misc';

export class Model<T> implements IValueModel<Nullable<T>>, IResetableModel {
    private _value: Getter<Nullable<T>>;

    private readonly _defaultValue: Getter<Nullable<T>>;

    constructor(v: Getter<Nullable<T>> = null) {
        this._value = v;
        this._defaultValue = v;
    }

    public get value() { return Getter.toValue(this._value)!; }
    public set value(v: T) {
        this.setValue(v);
    }

    public setValue(value: Getter<Nullable<T>>) {
        this._value = value;
    }

    public reset() {
        this.setValue(this._defaultValue);
    }
}
