import { observable, makeObservable, reaction, action } from 'mobx';
import type { IValueModel, IResetableModel, IValueModelReadonly, IFocusableModel } from '@zajno/common/models/types';
import { Getter } from '@zajno/common/types/getter';
import { ValidatableModel } from './Validatable.js';
import type { Nullable } from '@zajno/common/types';
import type { DisposeFunction, ISymbolDisposable } from '@zajno/common/functions/disposer';
import { SymbolDisposable } from '@zajno/common/functions/disposer.symbols';
import { ValueModel } from './ValueModel.js';
import { FlagModel } from './FlagModel.js';

export type TextInputConfig = {
    name?: Getter<string>;
    title?: Getter<string>;
    value?: Getter<string>;
    async?: boolean;

    noSubscribe?: boolean;
};

/**
 * The feature of this Text model is that it should store the observable copy of a value, pulled from source via reaction, with optional delay.
 *
 * However consider using ValueModel if it's just needed to store an observable value.
*/
export class Text extends SymbolDisposable implements IValueModelReadonly<string | null> {
    private _value: string | null = null;
    private _dispose: DisposeFunction | null = null;

    constructor(getter: () => string, delay?: number | boolean) {
        super();

        makeObservable<Text, '_value'>(this, {
            _value: observable,
        });

        this._dispose = FromGetter(
            getter,
            action(val => { this._value = val || null; }),
            delay === true ? 100 : (delay || undefined),
        );
    }

    get value() { return this._value; }

    dispose() {
        this._dispose?.();
        this._dispose = null;
    }
}

export class TextInputVM extends ValidatableModel<string> implements IValueModel<Nullable<string>>, IFocusableModel, IResetableModel, ISymbolDisposable {
    private readonly _value = new ValueModel<string | null>();
    private readonly _focused = new FlagModel();

    private readonly _name: ValueModel<string> | null = null;
    private readonly _title: ValueModel<string> | null = null;

    private _valueObserving: null | DisposeFunction = null;

    constructor(config?: TextInputConfig) {
        super();

        config = config || {};

        this._name = config.name ? new ValueModel(config.name) : null;
        this._title = config.title ? new ValueModel(config.title) : null;

        this._valueObserving = FromGetter(
            config.value,
            this._value.setValue.bind(this._value),
            config.async ? 100 : undefined,
        );
    }

    get name(): Nullable<string> { return this._name?.value; }
    get title(): Nullable<string> { return this._title?.value; }

    get value(): Nullable<string> { return this._value.value; }
    set value(val) {
        this.setValue(val);
    }

    public readonly setValue = (value: Nullable<string>, ignoreReadonly = false) => {
        if (!this._valueObserving) {
            this._value.setValue(value);

            this.validateOnChangeIfNeeded();
        } else if (!ignoreReadonly) {
            throw new Error('[TextInputVM] Setting value is not allowed when value is observing');
        }
    };

    get isEmpty() {
        return !this._value.value;
    }

    get focused(): boolean {
        return this._focused.value;
    }

    set focused(val: boolean) {
        this.setFocused(val);
    }

    // @action
    public readonly setFocused = (value = true) => {
        this._focused.setValue(value);
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
        this._value.reset();
        this._focused.reset();
        super.reset();
    });

    dispose(): void {
        this._valueObserving?.();
        this._valueObserving = null;
    }

    [Symbol.dispose]() { this.dispose(); }
}

/** Creates a reaction for migrating a value from getter to setter, with optional delay. */
function FromGetter(getter: Getter<Nullable<string>>, setter: (val: Nullable<string>) => void, autorunDelay?: Nullable<number>, noAutorun?: Nullable<boolean>) {
    if (noAutorun || typeof getter !== 'function') {
        setter(Getter.toValue(getter));
        return null;
    }

    return reaction(
        Getter.toFn(getter),
        setter,
        {
            delay: autorunDelay ?? undefined,
            fireImmediately: true,
        },
    );
}
