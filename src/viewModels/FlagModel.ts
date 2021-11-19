import { makeObservable, observable } from 'mobx';

export interface IFlagModelReadonly {
    readonly value: boolean;
}

export interface IFlagModel {
    value: boolean;
}

export class FlagModel implements IFlagModelReadonly, IFlagModel {
    constructor() {
        makeObservable(this);
    }

    @observable
    private _value: boolean = false;

    get value() {
        return this._value;
    }

    set value(value: boolean) {
        this._value = value;
    }
}
