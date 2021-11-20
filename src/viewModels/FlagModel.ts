import { makeObservable, observable } from 'mobx';

export interface IFlagModel {
    value: boolean;
}

export type IFlagModelReadonly = Readonly<IFlagModel>;
export class FlagModel implements IFlagModel, IFlagModelReadonly {

    @observable
    private _value: boolean = false;

    constructor() {
        makeObservable(this);
    }

    get value() {
        return this._value;
    }

    set value(value: boolean) {
        this._value = value;
    }
}
