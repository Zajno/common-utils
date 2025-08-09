import { Lazy } from '@zajno/common/lazy';
import { LazyPromise } from '@zajno/common/lazy/promise';
import { observable, makeObservable, action } from 'mobx';
import { ObservableTypes } from '../observing/types.js';

export class LazyObservable<T> extends Lazy<T> {

    constructor(factory: (() => T), observableType: ObservableTypes = ObservableTypes.Default) {
        super(factory);

        makeObservable<Lazy<T>, '_instance'>(this, {
            _instance: ObservableTypes.toDecorator(observableType),
            setInstance: action,
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
            '_instance' | '_isLoading' | 'ensureInstanceLoading' | 'onResolved'
        >(this, {
            _instance: ObservableTypes.toDecorator(observableType),
            _isLoading: observable,
            setInstance: action,
            ensureInstanceLoading: action,
            onResolved: action,
            reset: action,
        });
    }
}
