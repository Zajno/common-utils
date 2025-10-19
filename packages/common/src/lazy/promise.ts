import { tryDispose, type IDisposable } from '../functions/disposer.js';
import type { IResettableModel } from '../models/types.js';
import type { IExpireTracker } from '../structures/expire.js';
import type { ILazyPromise, ILazyPromiseExtension, LazyFactory } from './types.js';

export class LazyPromise<T, TInitial extends T | undefined = undefined> implements ILazyPromise<T, TInitial>, IDisposable, IResettableModel {

    private readonly _factory: LazyFactory<T>;
    private readonly _initial: TInitial;

    private _instance: T | TInitial;
    private _isLoading: boolean | null = null;

    private _promise: Promise<T> | undefined;
    private _expireTracker: IExpireTracker | undefined;

    private _lastRefreshingPromise: Promise<T> | null = null;
    private _error: string | null = null;

    constructor(
        factory: LazyFactory<T>,
        initial?: TInitial,
    ) {
        this._factory = factory;
        this._initial = initial as TInitial;

        this._instance = initial as T | TInitial; // as ILazyValue<T, TInitial>;
    }

    public get isLoading() { return this._isLoading; }
    public get hasValue() { return this._isLoading === false; }
    public get error() { return this._error; }

    public get promise() {
        this.ensureInstanceLoading();
        return this._promise!;
    }

    get value(): T | TInitial {
        this.ensureInstanceLoading();
        return this._instance;
    }

    /** does not calls factory */
    public get currentValue(): T | TInitial {
        return this._instance;
    }

    public withExpire(tracker: IExpireTracker | undefined) {
        this._expireTracker = tracker;
        return this;
    }

    /**
     * Factory method for creating new instances of this class.
     * Override this in subclasses to ensure `extend()` returns the correct type.
     *
     * @param factory - The factory function for the new instance
     * @param initial - The initial value for the new instance
     * @returns A new instance of the same class type
     */
    protected createInstance(factory: LazyFactory<T>, initial?: TInitial): this {
        return new LazyPromise(factory, initial) as this;
    }

    /**
     * Creates a new extended instance with additional functionality.
     * Returns a new immutable instance; the original remains unchanged.
     *
     * **Extension capabilities:**
     * - `overrideFactory`: Wrap/modify the factory function (logging, retry, caching, etc.)
     * - `extendShape`: Add custom properties/methods to the instance
     *
     * **Type safety:** Extensions enforce type compatibility via generic `T` parameter.
     * Use `ILazyPromiseExtension<any>` for universal extensions, or `ILazyPromiseExtension<ConcreteType>`
     * for type-specific extensions (e.g., number-only operations).
     *
     * **Inheritance support:** Subclasses (e.g., `LazyPromiseObservable`) return their own type
     * with preserved behavior (MobX observability, etc.).
     *
     * @param extension - Configuration with factory override and/or shape extensions
     * @returns New instance of the same class with applied extensions
     *
     * @example
     * ```typescript
     * // Logging extension (universal)
     * const withLogging = lazy.extend({
     *   overrideFactory: (factory) => async (refreshing) => {
     *     console.log('Loading...', { refreshing });
     *     const result = await factory(refreshing);
     *     console.log('Loaded:', result);
     *     return result;
     *   }
     * });
     *
     * // Retry extension (universal)
     * const withRetry = lazy.extend({
     *   overrideFactory: (factory) => async (refreshing) => {
     *     try {
     *       return await factory(refreshing);
     *     } catch (e) {
     *       console.warn('Retrying...');
     *       return await factory(refreshing);
     *     }
     *   }
     * });
     *
     * // Custom methods (type-specific for numbers)
     * const withStats = lazyNumber.extend<{ double: () => number | undefined }>({
     *   extendShape: (instance) => Object.assign(instance, {
     *     double: () => {
     *       const val = instance.currentValue;
     *       return val !== undefined ? val * 2 : undefined;
     *     }
     *   })
     * });
     *
     * // Chaining extensions
     * const composed = lazy.extend(loggingExt).extend(retryExt);
     * ```
     */
    public extend<TExtShape extends object = object>(
        extension: ILazyPromiseExtension<T, TExtShape>,
    ): this & TExtShape {
        // Get the factory to use (potentially overridden)
        const factory = extension.overrideFactory
            ? extension.overrideFactory(this._factory, this as ILazyPromise<T, TInitial>)
            : this._factory;

        // Create new instance with the (potentially modified) factory
        const extended = this.createInstance(factory, this._initial);

        // Copy expire tracker if present
        if (this._expireTracker) {
            extended.withExpire(this._expireTracker);
        }

        // Apply shape extension if provided
        if (extension.extendShape) {
            return extension.extendShape(extended) as this & TExtShape;
        }

        return extended as this & TExtShape;
    }

    protected ensureInstanceLoading() {
        if (this.isLoading === false && this._instance !== undefined && this._expireTracker?.isExpired) {
            // do not reset the instance, just make sure it will be reloaded
            this._isLoading = null;
        }

        if (this._isLoading === null) {
            this._isLoading = true;
            this.doLoad();
        }
    }

    protected doLoad() {
        this._promise = this._factory(false)
            .then(this.onResolved.bind(this))
            .catch(this.onRejected.bind(this));
    }

    protected onResolved(res: T) {
        // case: during the promise `setInstance` was called
        if (!this._isLoading && this._instance !== undefined) {
            return this._instance;
        }
        this.setInstance(res);
        return res;
    }

    protected onRejected(e: unknown) {
        this._isLoading = false;
        this._instance = this._initial;
        this._promise = Promise.resolve(this._initial as T);
        this.setError(e);
        return this._initial as T;
    }

    public setInstance(res: T) {
        this._isLoading = false;
        this.clearError(); // clear error on successful set

        // refresh promise so it won't keep old callbacks
        // + make sure it's resolved with the freshest value
        // also do this before setting the instance... just in case :)
        this._promise = Promise.resolve(res);

        this._instance = res;

        if (this._expireTracker) {
            this._expireTracker.restart();
        }

        return res;
    }

    protected setError(err: unknown) {
        this._error = this.parseError(err);
    }

    protected clearError() {
        this._error = null;
    }

    public async refresh(): Promise<T> {
        let myPromise: Promise<T> | null = null;
        try {
            myPromise = this._factory(true);

            // every new refresh overrides the previous one
            // so this one becomes "last"
            // and previous becomes stale and won't update the value when it resolves
            this._lastRefreshingPromise = myPromise;
            const fresh = await myPromise;
            if (this._lastRefreshingPromise === myPromise) {
                this.setInstance(fresh);
            }

            return fresh;
        } catch (e: unknown) {
            this.setError(e);
            return this._instance as T;
        } finally {
            if (myPromise != null && this._lastRefreshingPromise === myPromise) {
                this._lastRefreshingPromise = null;
            }
        }
    }

    public reset() {
        this._isLoading = null;
        this.clearError();

        const wasDisposed = tryDispose(this._instance);

        this._instance = this._initial;

        const p = this._promise;
        this._promise = undefined;

        // check if loading is still in progress
        // need to dispose abandoned value
        if (p && !wasDisposed) {
            p.then(value => {
                tryDispose(value);
            });
        }
    }

    public dispose() {
        this.reset();
    }

    protected parseError(err: unknown): string {
        if (typeof err === 'string') {
            return err;
        }
        if (err instanceof Error) {
            return err.message;
        }
        return String(err) || 'Unknown error';
    }
}
