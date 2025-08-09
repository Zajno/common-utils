import { action, makeObservable, observable } from 'mobx';
import type { IValueModel, IResettableModel } from '@zajno/common/models/types';

export interface INumberModel extends IResettableModel {
    value: number;
}

export class NumberModel implements INumberModel, IValueModel<number> {

    private _value: number;

    private _initial: number;

    constructor(initial: number = 0) {
        this._initial = initial;
        this._value = this._initial;

        makeObservable<NumberModel, '_value'>(this, {
            _value: observable,
            setValue: action,
            reset: action,
            increment: action,
            decrement: action,
        });
    }

    get value() { return this._value; }
    set value(v: number) { this.setValue(v); }

    // @action
    public setValue(v: number) {
        this._value = v;
    }

    get isDefault() { return this._value === this._initial; }

    // @action
    reset = () => {
        this.setValue(this._initial);
    };

    // @action
    increment = (d = 1) => this.setValue(this._value + d);

    // @action
    decrement = (d = 1) => this.setValue(this._value - d);
}
