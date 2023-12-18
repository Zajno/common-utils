import { action, makeObservable } from 'mobx';
import { Getter } from '@zajno/common/types/getter';
import { Model } from '@zajno/common/models/Model';
import { ObservableTypes } from '../observing/types';
import { Nullable } from '@zajno/common/types/misc';

export class ValueModel<T> extends Model<T> {
    constructor(v: Getter<Nullable<T>> = null, useRefObservable = true) {
        super(v);

        makeObservable<ValueModel<T>, '_value'>(this, {
            _value: ObservableTypes.toDecorator(useRefObservable),
            setValue: action,
        });
    }
}
