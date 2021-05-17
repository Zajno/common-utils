import { observable, autorun, computed, action, makeObservable } from 'mobx';
import logger from '../logger';
import { ValidatableViewModel, ValidationConfig } from './Validatable';

export type StringGetter = (() => string) | string;

export type TextInputConfig = {
    name?: StringGetter;
    title?: StringGetter;
    value?: StringGetter;
    async?: boolean;

    validation?: ValidationConfig;
    noSubscribe?: boolean;
};

function FromGetter(getter: StringGetter, setter: (val: string) => void, autorunDelay: number = null, noAutorun: boolean = null) {
    if (typeof getter === 'function') {
        if (noAutorun) {
            setter(getter());
        } else {
            autorun(() => {
                setter(getter());
            }, { delay: autorunDelay });
            return true;
        }
    } else if (typeof getter === 'string') {
        setter(getter);
    }
    return false;
}

export class Text {
    @observable
    private _value: string = null;

    constructor(config: { value: StringGetter, async?: boolean, noSubscribe?: boolean }) {
        makeObservable(this);
        FromGetter(config.value, val => this._value = val, config.async ? 100 : null, config.noSubscribe);
    }

    get value() { return this._value; }
}

export class TextInputVM extends ValidatableViewModel {
    @observable
    private _value = '';

    @observable
    private _focused = false;

    @observable
    private _name: string = null;

    @observable
    private _title: string = null;

    private readonly _valueObserving: boolean = null;

    constructor(config?: TextInputConfig) {
        super(config && config.validation);
        makeObservable(this);
        config = config || {};

        const delay = config.async ? 100 : null;

        FromGetter(config.name, val => this._name = val, delay);
        FromGetter(config.title, val => this._title = val, delay);
        this._valueObserving = FromGetter(config.value, val => this._value = val, delay);
    }

    get value() { return this._value; }
    get name() { return this._name; }
    get title() { return this._title; }

    set value(val) {
        if (!this._valueObserving) {
            this._value = val;
        } else {
            logger.warn('[TextInputViewModel] Setting value is not allowed when value is observing');
        }
    }

    @computed
    get isEmpty() {
        return !this._value;
    }

    get focused() {
        return this._focused;
    }

    set focused(val) {
        this._focused = val;
        if (!val) {
            this.onBlur();
            return;
        }

        super.reset();
    }

    protected get valueToValidate() { return this.value; }

    private onBlur() {
        this.validate();
    }

    @action
    reset() {
        this._value = '';
        this._focused = false;
        super.reset();
    }

}
