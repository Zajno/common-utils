import { action, makeObservable, observable } from 'mobx';
import { Getter } from '@zajno/common/lib/types';
import { IValueModel } from './types';

export class ValueModel<T> implements IValueModel<T> {
    // observable[.ref]
    private _value: T;

    private _defaultValue: Getter<T> = null;

    constructor(v: Getter<T> = null, useRefObservable = true) {
        this._value = Getter.getValue(v) || null;
        this._defaultValue = v;

        makeObservable<ValueModel<T>, '_value'>(this, {
            _value: useRefObservable ? observable.ref : observable,
            setValue: action,
        });
    }

    public get value() { return this._value; }
    public set value(v: T) {
        this.setValue(v);
    }

    // action
    public readonly setValue = (value: T) => {
        this._value = value;
    };

    reset = () => {
        this._value = Getter.getValue(this._defaultValue);
    };
}
