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

export class LazyPromiseObservable<T, TInitial extends T | undefined = undefined> extends LazyPromise<T, TInitial> {

    private readonly _observableType: ObservableTypes;

    constructor(
        factory: () => Promise<T>,
        observableType: ObservableTypes = ObservableTypes.Default,
        initial?: TInitial,
    ) {
        super(factory, initial);
        this._observableType = observableType;

        makeObservable<
            LazyPromise<T, TInitial>,
            '_instance' | '_isLoading' | 'ensureInstanceLoading' | 'onResolved' | 'onRejected' | '_error' | 'setError' | 'clearError'
        >(this, {
            _instance: ObservableTypes.toDecorator(observableType),
            _isLoading: observable,
            _error: observable,
            setInstance: action,
            setError: action,
            clearError: action,
            ensureInstanceLoading: action,
            onResolved: action,
            onRejected: action,
            reset: action,
        });
    }

    protected createInstance(factory: () => Promise<T>, initial?: TInitial): this {
        return new LazyPromiseObservable(factory, this._observableType, initial) as this;
    }
}
