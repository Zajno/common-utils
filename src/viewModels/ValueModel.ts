import { action, makeObservable, observable } from 'mobx';
import { Getter } from '../types';
import { Model } from './Model';

export class ValueModel<T> extends Model<T> {
    constructor(v: Getter<T> = null, useRefObservable = true) {
        super(v);

        makeObservable<ValueModel<T>, '_value'>(this, {
            _value: useRefObservable ? observable.ref : observable,
            setValue: action,
        });
    }
}
