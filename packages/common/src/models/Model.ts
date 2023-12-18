import type { IValueModel } from './types';
import { Getter } from '../types/getter';
import { Nullable } from '../types/misc';

export class Model<T> implements IValueModel<Nullable<T>> {
    private _value: Nullable<T>;

    private readonly _defaultValue: Getter<Nullable<T>>;

    constructor(v: Getter<Nullable<T>> = null) {
        this._value = Getter.getValue(v);
        this._defaultValue = v;
    }

    public get value() { return this._value!; }
    public set value(v: T) {
        this.setValue(v);
    }

    public readonly setValue = (value: Nullable<T>) => {
        this._value = value;
    };

    public readonly reset = () => {
        this.setValue(Getter.getValue(this._defaultValue));
    };
}
