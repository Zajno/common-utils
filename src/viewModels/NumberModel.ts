import { action, makeObservable, observable } from 'mobx';
import type { IValueModel, IResetableModel } from '@zajno/common/models/types';

export interface INumberModel extends IResetableModel {
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
    public readonly setValue = (v: number) => {
        this._value = v;
    };

    get isDefault() { return this._value === this._initial; }

    // @action
    reset = () => {
        this._value = this._initial;
    };

    // @action
    increment = (d = 1) => this.value += d;

    // @action
    decrement = (d = 1) => this.value -= d;
}

export default NumberModel;
