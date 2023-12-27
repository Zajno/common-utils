import { IValueModelReadonly } from '@zajno/common/models/types';
import { computed, makeObservable } from 'mobx';

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
