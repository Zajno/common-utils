
import { LazyObservable, LazyPromiseObservable } from './observable';
import logger from '../logger';

// Backward compatibility stuff ...

class LazyObservableWarned<T> extends LazyObservable<T> {

    constructor(factory: () => T) {
        super(factory);

        logger.log('@zajno/common/lazy: you are using LazyObservable but imported just as Lazy. To avoid this warning import LazyObservable directly from lazy/observable or use non-observable version from lazy/singleton.');
    }

}

class LazyPromiseObservableWarned<T> extends LazyPromiseObservable<T> {

    constructor(factory: () => Promise<T>, initial?: T) {
        super(factory, initial);

        logger.log('@zajno/common/lazy: you are using LazyPromiseObservableWarned but imported just as LazyPromise. To avoid this warning import LazyPromiseObservable directly from lazy/observable or use non-observable version from lazy/promise.');
    }

}

export default LazyObservableWarned;

// In future versions make these imports straight
export {
    LazyObservableWarned as Lazy,
    LazyPromiseObservableWarned as LazyPromise,
};
