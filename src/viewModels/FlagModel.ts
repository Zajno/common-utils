import { action, makeObservable, observable } from 'mobx';
import { IResetableModel } from 'viewModels';
import { ILabel, IValueModel } from './types';

export interface IFlagModel extends IValueModel<boolean>, IResetableModel {
    toggle(): void;
}

export type IFlagModelReadonly = {
    readonly value: boolean;
};

export type ILabeledFlagModel = IFlagModel & ILabel<string>;

export class FlagModel implements IFlagModel, IFlagModelReadonly {

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

    get isDefault() { return this._value === false; }

    @action
    setTrue = () => {
        const v = this.value;
        this.value = true;
        return !v;
    };

    @action
    setFalse = () => {
        const v = this.value;
        this.value = false;
        return v;
    };

    @action
    toggle = () => {
        this._value = !this._value;
    };

    @action
    reset = () => {
        this._value = false;
    };
}
