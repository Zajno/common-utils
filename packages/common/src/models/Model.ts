import type { IValueModel } from './types';
import { Getter } from '../types/getter';

export class Model<T> implements IValueModel<T> {
    private _value: T | undefined | null;

    private readonly _defaultValue: Getter<T> | null;

    constructor(v: Getter<T> | null = null) {
        this._value = Getter.getValue(v) ?? undefined;
        this._defaultValue = v;
    }

    public get value() { return this._value!; }
    public set value(v: T) {
        this.setValue(v);
    }

    public readonly setValue = (value: T | undefined | null) => {
        this._value = value;
    };

    public readonly reset = () => {
        if (this._defaultValue == null) {
            this.setValue(undefined);
        } else {
            this.setValue(Getter.getValue(this._defaultValue));
        }
    };
}
