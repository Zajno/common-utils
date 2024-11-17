import { IValueModelReadonly } from '@zajno/common/models/types';
import { computed, makeObservable, reaction } from 'mobx';
import { ValueModel } from './ValueModel';
import { IDisposable, tryDispose } from '@zajno/common/functions/disposer';

export class ComputedValueModel<T> implements IValueModelReadonly<T> {
    constructor(private readonly _getter: () => T) {
        makeObservable(this, {
            value: computed,
        });
    }

    public get value(): T {
        return this._getter();
    }
}

export class ManualComputedValueModel<T> implements IValueModelReadonly<T>, IDisposable {

    private readonly _value = new ValueModel<T | undefined>(undefined, true);
    private readonly _reactionUnsubscribe: () => void;

    constructor(private readonly _getter: () => T, delay = 50) {

        let delayHandle: ReturnType<typeof setTimeout> | null = null;

        this._reactionUnsubscribe = reaction(
            () => this._getter(),
            value => {
                if (this._value.value !== value) {
                    tryDispose(this._value.value);
                }

                if (delayHandle) {
                    clearTimeout(delayHandle);
                    delayHandle = null;
                }

                delayHandle = setTimeout(() => {
                    this._value.setValue(value);
                }, delay);
            },
            { fireImmediately: true },
        );
    }

    public get value(): T {
        return this._value.value!;
    }

    dispose(): void {
        this._reactionUnsubscribe();
        tryDispose(this._value.value);
        this._value.reset();
    }
}
