import { action, makeObservable, observable } from 'mobx';
import { Getter } from '@zajno/common/types';
import { Model } from '@zajno/common/models/Model';

export class ValueModel<T> extends Model<T> {
    constructor(v: Getter<T> = null, useRefObservable = true) {
        super(v);

        makeObservable<ValueModel<T>, '_value'>(this, {
            _value: useRefObservable ? observable.ref : observable,
            setValue: action,
        });
    }
}
