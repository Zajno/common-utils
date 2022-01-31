import { action, makeObservable, observable } from 'mobx';
import { ValidatableModel } from './Validatable';

export class CommonModel<T = any> extends ValidatableModel<T> {

    @observable.ref
    private _value: T = null;

    private _defaultValue: T = null;
    private _validateOnChange = false;

    constructor(v: T = null) {
        super();
        makeObservable(this);
        this._value = v;
        this._defaultValue = v;
    }

    validateOnChange(enable = true) {
        this._validateOnChange = enable;
        return this;
    }

    protected get valueToValidate(): Readonly<T> {
        return this._value;
    }

    public get value() { return this._value; }
    public set value(v: T) {
        this.setValue(v);
    }

    @action
    public readonly setValue = (value: T) => {
        this._value = value;

        if (this._validateOnChange) {
            this.validate();
        }
    };

    reset = () => {
        super.reset();
        this.value = this._defaultValue;
    };
}
