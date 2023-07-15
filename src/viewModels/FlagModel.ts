import { action, makeObservable, observable } from 'mobx';
import type { IResetableModel, ILabel, IValueModel } from '@zajno/common/models/types';

export interface IFlagModel extends IValueModel<boolean>, IResetableModel {
    toggle(): void;
}

export type IFlagModelReadonly = {
    readonly value: boolean;
};

export type ILabeledFlagModel = IFlagModel & ILabel<string>;

export class FlagModel implements IFlagModel, IFlagModelReadonly {

    // @observable
    private _value: boolean = false;

    constructor(initial = false) {
        this._value = initial;
        makeObservable<FlagModel, '_value'>(this, {
            _value: observable,
            setValue: action,
        });
    }

    get value() {
        return this._value;
    }

    set value(value: boolean) {
        this.setValue(value);
    }

    // @action
    /** override me to spy */
    public setValue(value: boolean) {
        this._value = value;
    }

    get isDefault() { return this._value === false; }

    /** @returns whether the value has changed */
    setTrue = () => {
        const v = this.value;
        this.value = true;
        return !v;
    };

    /** @returns whether the value has changed */
    setFalse = () => {
        const v = this.value;
        this.value = false;
        return v;
    };

    /** Possible issue: if this method is used in trackable context (e.g. autorun), it might lead to an infinite loop  */
    toggle = () => {
        this.value = !this.value;
    };

    reset = () => {
        this.value = false;
    };
}
