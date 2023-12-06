import { action, makeObservable, observable } from 'mobx';
import { Getter } from '@zajno/common/types/getter';
import { ValidatableModel } from './Validatable';

export class CommonModel<T = any> extends ValidatableModel<T> {

    // observable[.ref]
    private _value: T;

    private _defaultValue: Getter<T> = null;

    constructor(v: Getter<T> = null, useRefObservable = true) {
        super();
        this._value = Getter.getValue(v) || null;
        this._defaultValue = v;

        makeObservable<CommonModel<T>, '_value'>(this, {
            _value: useRefObservable ? observable.ref : observable,
            setValue: action,
        });
    }

    protected get valueToValidate(): Readonly<T> {
        return this._value;
    }

    public get value() { return this._value; }
    public set value(v: T) {
        this.setValue(v);
    }

    // action
    public readonly setValue = (value: T) => {
        this._value = value;

        if (this._validateOnChange) {
            this.validate();
        }
    };

    reset = () => {
        this._value = Getter.getValue(this._defaultValue);
        super.reset();
    };
}
