import type { Disposer } from '@zajno/common/functions/disposer.js';
import { Lazy, type ILazyPromise, type ILazyPromiseExtension, type LazyFactory } from '@zajno/common/lazy';
import { LazyPromise } from '@zajno/common/lazy/promise';
import { extendObject } from '@zajno/common/structures/extendObject';
import { assert } from '@zajno/common/functions/assert';
import { action, makeObservable, observable, Reaction } from 'mobx';
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


export type LazyPromiseObservableConfig<TInitial> = {
    observableType?: ObservableTypes;
    initial?: TInitial;
    observing?: boolean | ObserveFactoryOptions;
};

export class LazyPromiseObservable<T, TInitial extends T | undefined = undefined> extends LazyPromise<T, TInitial> {

    constructor(
        factory: LazyFactory<T>,
        observableType?: ObservableTypes,
        initial?: TInitial
    );

    constructor(
        factory: LazyFactory<T>,
        options?: LazyPromiseObservableConfig<TInitial>,
    );

    constructor(
        factory: LazyFactory<T>,
        observableType: ObservableTypes | LazyPromiseObservableConfig<TInitial> = ObservableTypes.Default,
        initial?: TInitial,
    ) {
        let _observableType: ObservableTypes;
        let _observing: LazyPromiseObservableConfig<TInitial>['observing'] = false;
        if (observableType != null && typeof observableType === 'object') {
            initial = observableType.initial;
            _observableType = observableType.observableType ?? ObservableTypes.Default;
            _observing = observableType.observing ?? false;
        } else {
            _observableType = observableType ?? ObservableTypes.Default;
        }

        super(factory, initial);

        makeObservable<
            LazyPromise<T, TInitial>,
            '_instance' | '_isLoading' | 'ensureInstanceLoading' | 'onRejected' | '_error' | 'setError' | 'clearError'
        >(this, {
            _instance: ObservableTypes.toDecorator(_observableType),
            _isLoading: observable,
            _error: observable,
            setInstance: action,
            setError: action,
            clearError: action,
            ensureInstanceLoading: action,
            onRejected: action,
            reset: action,
        });

        if (_observing) {
            const options = typeof _observing === 'object' ? _observing : {};
            this.extend(createObservingExtension(options));
        }
    }
}


/**
 * Options for creating an observing extension.
 */
export type ObserveFactoryOptions = {
    /** Function that accesses observables to track. Called synchronously before factory execution. */
    track?: () => unknown;
    /** Optional disposer to register the reaction cleanup. */
    disposer?: Disposer;
};

/**
 * Creates an extension that automatically refreshes LazyPromise when tracked observables change.
 *
 * Dependencies are tracked during factory execution. When any tracked observable changes,
 * the LazyPromise will automatically call `refresh()` to reload the data.
 *
 * @param options - Configuration for tracking and disposal
 * @returns Extension that adds automatic refresh on dependency changes
 *
 * @example
 * ```typescript
 * const userStore = observable({ userId: 1 });
 *
 * const userLazy = new LazyPromiseObservable(() => fetchUser(userStore.userId))
 *   .extend(createObservingExtension({
 *     track: () => userStore.userId,
 *   }));
 *
 * // When userStore.userId changes, userLazy automatically refreshes
 * ```
 */
export function createObservingExtension(options?: ObserveFactoryOptions): ILazyPromiseExtension {

    const { track, disposer } = options || {};

    type InstanceData = {
        __reaction?: Reaction;
    };

    return {

        extendShape: (instance) => {
            assert(!('__reaction' in (instance as InstanceData)), 'Observing extension already applied to this instance');

            const _reaction = new Reaction(
                'LazyPromiseObservableFactoryTracker',
                () => {
                    instance.refresh();
                },
            );

            disposer?.add(_reaction);

            // extending hiddenly
            extendObject<ILazyPromise<any>, InstanceData>(instance, {
                __reaction: {
                    value: _reaction,
                    enumerable: false,
                    configurable: true,
                },
            });

            return instance;
        },

        overrideFactory: (original, instance) => {
            return (...args) => {
                const { __reaction } = instance as InstanceData;
                if (!__reaction) {
                    return original(...args);
                }

                let result: ReturnType<typeof original>;

                try {
                    __reaction.track(() => {
                        track?.();
                        result = original(...args);
                    });
                } catch {
                    // Reaction might be disposed, just call original
                    return original(...args);
                }

                return result!;
            };

        },

        dispose: (instance) => {
            const reactive = instance as InstanceData;
            reactive.__reaction?.dispose();
            delete reactive.__reaction;
        },

    };
}
