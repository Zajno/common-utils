import { action, makeObservable, observable } from 'mobx';
import { ILabel } from './wrappers';
import { IValueModel } from './ValuesCollector';

export interface IFlagModel {
    value: boolean;
}

export type IFlagModelReadonly = Readonly<IFlagModel>;

export type ILabeledFlagModel = IFlagModel & ILabel<string>;

export class FlagModel implements IFlagModel, IFlagModelReadonly, IValueModel<boolean> {

    @observable
    private _value: boolean = false;

    constructor(initial = false) {
        makeObservable(this);
        this._value = initial;
    }

    get value() {
        return this._value;
    }

    set value(value: boolean) {
        this._value = value;
    }

    @action
    toggle = () => {
        this._value = !this._value;
    };

    @action
    reset = () => {
        this._value = false;
    };
}
