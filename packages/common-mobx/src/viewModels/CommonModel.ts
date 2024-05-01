import { action, makeObservable, observable } from 'mobx';
import { Getter } from '@zajno/common/types/getter';
import { ValidatableModel } from './Validatable';
import { IValueModel } from '@zajno/common/models/types';

export class CommonModel<T = any> extends ValidatableModel<T> implements IValueModel<T> {

    private _value: T;
    private _defaultValue: Getter<T>;

    constructor(v: Getter<T>, useRefObservable = true) {
        super();
        this._value = Getter.getValue(v);
        this._defaultValue = v;

        makeObservable<CommonModel<T>, '_value'>(this, {
            _value: useRefObservable ? observable.ref : observable,
            setValue: action,
        });
    }

    protected get valueToValidate(): Readonly<T | null> {
        return this._value;
    }

    public get value(): T { return this._value; }
    public set value(v: T) {
        this.setValue(v);
    }

    // action
    public readonly setValue = (value: T) => {
        this._value = value;

        this.validateOnChangeIfNeeded();
    };

    reset = () => {
        this.setValue(Getter.getValue(this._defaultValue));
        super.reset();
    };
}
