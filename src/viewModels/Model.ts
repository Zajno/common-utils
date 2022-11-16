import type { IValueModel } from './types';
import { Getter } from '../types';

export class Model<T> implements IValueModel<T> {
    private _value: T;

    private readonly _defaultValue: Getter<T> = null;

    constructor(v: Getter<T> = null) {
        this._value = Getter.getValue(v) || null;
        this._defaultValue = v;
    }

    public get value() { return this._value; }
    public set value(v: T) {
        this.setValue(v);
    }

    public readonly setValue = (value: T) => {
        this._value = value;
    };

    public readonly reset = () => {
        this.setValue(Getter.getValue(this._defaultValue));
    };
}
