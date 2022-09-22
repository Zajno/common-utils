import { Lazy } from './singleton';
import { LazyPromise } from './promise';
import { observable, makeObservable, action } from 'mobx';

export class LazyObservable<T> extends Lazy<T> {

    constructor(factory: (() => T)) {
        super(factory);

        makeObservable<Lazy<T>, '_instance' | 'ensureInstance'>(this, {
            _instance: observable,
            reset: action,
            ensureInstance: action,
        });
    }
}

export class LazyPromiseObservable<T> extends LazyPromise<T> {

    constructor(
        factory: () => Promise<T>,
        initial?: T,
    ) {
        super(factory, initial);

        makeObservable<LazyPromise<T>, '_instance' | '_busy' | 'setInstance'>(this, {
            _instance: observable.ref,
            _busy: observable,
            setInstance: action,
            reset: action,
        });
    }
}
