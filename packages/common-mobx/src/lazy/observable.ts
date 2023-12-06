import { Lazy } from '@zajno/common/lazy/singleton';
import { LazyPromise } from '@zajno/common/lazy/promise';
import { observable, makeObservable, action } from 'mobx';
import { ObservableTypes } from '../observing/types';

export class LazyObservable<T> extends Lazy<T> {

    constructor(factory: (() => T), observableType: ObservableTypes = ObservableTypes.Default) {
        super(factory);

        makeObservable<Lazy<T>, '_instance' | 'ensureInstance'>(this, {
            _instance: ObservableTypes.toDecorator(observableType),
            reset: action,
            ensureInstance: action,
        });
    }
}

export class LazyPromiseObservable<T> extends LazyPromise<T> {

    constructor(
        factory: () => Promise<T>,
        observableType: ObservableTypes = ObservableTypes.Default,
        initial?: T,
    ) {
        super(factory, initial);

        makeObservable<
            LazyPromise<T>,
            '_instance' | '_busy' | 'setInstance' | 'ensureInstanceLoading'
        >(this, {
            _instance: ObservableTypes.toDecorator(observableType),
            _busy: observable,
            setInstance: action,
            ensureInstanceLoading: action,
            reset: action,
        });
    }
}
