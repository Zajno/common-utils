import { action, makeObservable } from 'mobx';
import { Getter } from '@zajno/common/types';
import { Model } from '@zajno/common/models/Model';
import { ObservableTypes } from '../observing/types';

export class ValueModel<T> extends Model<T> {
    constructor(v: Getter<T> = null, useRefObservable = true) {
        super(v);

        makeObservable<ValueModel<T>, '_value'>(this, {
            _value: ObservableTypes.toDecorator(useRefObservable),
            setValue: action,
        });
    }
}
