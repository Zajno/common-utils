import { action, makeObservable, observable } from 'mobx';
import { IValueModel } from './ValuesCollector';

export interface INumberModel {
    value: number;
}

export class NumberModel implements INumberModel, IValueModel<number> {

    @observable
    private _value: number = 0;

    private _initial: number = 0;

    constructor(initial: number = 0) {
        makeObservable(this);
        this._initial = initial;
        this._value = this._initial;
    }

    get value() { return this._value; }
    set value(v: number) { this._value = v; }

    @action
    reset = () => {
        this._value = this._initial;
    };

    @action
    increment = (d = 1) => this.value += d;

    @action
    decrement = (d = 1) => this.value -= d;
}

export default NumberModel;
