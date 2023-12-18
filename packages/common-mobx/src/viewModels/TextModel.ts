import { observable, makeObservable, reaction, action, runInAction } from 'mobx';
import type { IValueModel, IResetableModel, IValueModelReadonly } from '@zajno/common/models/types';
import logger from '@zajno/common/logger/index';
import { Getter } from '@zajno/common/types/getter';
import { ValidatableModel } from './Validatable';
import { Nullable } from '@zajno/common/types';

export type TextInputConfig = {
    name?: Getter<string>;
    title?: Getter<string>;
    value?: Getter<string>;
    async?: boolean;

    noSubscribe?: boolean;
};

function FromGetter(getter: Getter<string | undefined>, setter: (val: string | undefined) => void, autorunDelay: number | undefined = undefined, noAutorun: boolean | undefined = undefined) {
    if (noAutorun || typeof getter !== 'function') {
        setter(Getter.getValue(getter));
        return null;
    }

    return reaction(
        () => Getter.getValue(getter),
        setter,
        { delay: autorunDelay, fireImmediately: true },
    );
}

export class Text implements IValueModelReadonly<string | null> {
    private _value: string | null = null;

    constructor(config: { value: Getter<string>, async?: boolean, noSubscribe?: boolean }) {
        makeObservable<Text, '_value'>(this, { _value: observable });
        FromGetter(config.value, val => this._value = val || null, config.async ? 100 : undefined, config.noSubscribe);
    }

    get value() { return this._value; }
}

export class TextInputVM extends ValidatableModel<string> implements IValueModel<Nullable<string>>, IResetableModel {
    private _value: string | null = '';

    private _focused = false;

    private _name: string | null = null;
    private _title: string | null = null;

    private readonly _valueObserving: null | (() => void) = null;

    constructor(config?: TextInputConfig) {
        super();

        config = config || {};

        const delay = config.async ? 100 : undefined;

        FromGetter(config.name, val => this._name = val || null, delay);
        FromGetter(config.title, val => this._title = val || null, delay);
        this._valueObserving = FromGetter(config.value, v => runInAction(() => { this._value = v || null; }), delay);

        makeObservable<TextInputVM, '_value' | '_focused'>(this, {
            _value: observable,
            _focused: observable,
            setValue: action,
            setFocused: action,
        });
    }

    get value() { return this._value; }
    get name() { return this._name; }
    get title() { return this._title; }

    set value(val) {
        this.setValue(val);
    }

    public readonly setValue = (value: string | null) => {
        if (!this._valueObserving) {
            this._value = value;

            if (this._validateOnChange) {
                this.validate();
            }
        } else {
            logger.warn('[TextInputVM] Setting value is not allowed when value is observing');
        }
    };

    get isEmpty() {
        return !this._value;
    }

    get focused() {
        return this._focused;
    }

    set focused(val: boolean) {
        this.setFocused(val);
    }

    // @action
    public readonly setFocused = (value = true) => {
        this._focused = value;
        if (!value) {
            this.onBlur();
            return;
        }

        super.reset();
    };

    protected get valueToValidate() { return (this.value ?? '').trim(); }

    private onBlur() {
        this.validate();
    }

    reset = action(() => {
        this._value = '';
        this._focused = false;
        super.reset();
    });

}
