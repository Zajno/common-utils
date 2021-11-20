import { action, makeObservable, observable } from 'mobx';

export interface IFlagModel {
    value: boolean;
}

export type IFlagModelReadonly = Readonly<IFlagModel>;

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

    @action
    toggle = () => {
        this._value = !this._value;
    };

    @action
    reset = () => {
        this._value = false;
    };
}
