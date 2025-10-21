import { tryDispose, type IDisposable } from '../functions/disposer.js';
import type { IResettableModel } from '../models/types.js';
import type { IExpireTracker } from '../structures/expire.js';
import type { IControllableLazyPromise, ILazyPromiseExtension, LazyFactory } from './types.js';

export class LazyPromise<T, TInitial extends T | undefined = undefined> implements IControllableLazyPromise<T, TInitial>, IDisposable, IResettableModel {

    private _factory: LazyFactory<T>;
    private readonly _initial: TInitial;

    private _instance: T | TInitial;
    private _isLoading: boolean | null = null;

    private _promise: Promise<T> | undefined;
    private _expireTracker: IExpireTracker | undefined;

    // Track the active factory promise to determine "latest wins"
    private _activeFactoryPromise: Promise<T> | null = null;
    private _error: string | null = null;

    private _ownDisposer?: () => void;

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
     * Extends this instance with additional functionality by applying extensions in place.
     *
     * **Capabilities:**
     * - `overrideFactory`: Wrap the factory function (logging, retry, caching, etc.)
     * - `extendShape`: Add custom properties/methods to the instance
     *
     * **Type Safety:**
     * - Use `ILazyPromiseExtension<any>` for universal extensions
     * - Use `ILazyPromiseExtension<ConcreteType>` for type-specific extensions (e.g., number-only)
     *
     * **Note:** Extensions mutate the instance and can be chained. Subclasses preserve their type.
     *
     * @param extension - Configuration with factory override and/or shape extensions
     * @returns The same instance (this) with applied extensions
     *
     * @example
     * ```typescript
     * // Universal logging extension
     * const logged = lazy.extend({
     *   overrideFactory: (factory) => async (refreshing) => {
     *     console.log('Loading...');
     *     return await factory(refreshing);
     *   }
     * });
     *
     * // Type-specific extension with custom methods
     * const enhanced = lazyNumber.extend<{ double: () => number | undefined }>({
     *   extendShape: (instance) => Object.assign(instance, {
     *     double: () => instance.currentValue !== undefined
     *       ? instance.currentValue * 2
     *       : undefined
     *   })
     * });
     *
     * // Chaining multiple extensions
     * const composed = lazy
     *   .extend(cacheExtension)
     *   .extend(loggingExtension);
     * ```
     */
    public extend<TExtShape extends object = object>(
        // Partial allows extensions with extra properties beyond the interface
        // 'any' type parameter doesn't affect return type since we return 'this'
        extension: Partial<ILazyPromiseExtension<any, TExtShape>>,
    ): object extends TExtShape ? this : this & TExtShape {

        let extended = this as this & TExtShape;

        // Apply shape extension if provided
        if (extension.extendShape) {
            extended = extension.extendShape(this) as this & TExtShape;
        }

        // Override the factory if provided
        if (extension.overrideFactory) {
            this._factory = extension.overrideFactory(this._factory, extended);
        }

        if (extension.dispose) {
            const previousDisposer = this._ownDisposer;
            const nextDisposer = extension.dispose;

            this._ownDisposer = () => {
                nextDisposer(extended);
                previousDisposer?.();
            };
        }

        return extended;
    }

    public setInstance(res: T) {
        this._isLoading = false;
        this.clearError(); // clear error on successful set

        // refresh promise so it won't keep old callbacks
        // + make sure it's resolved with the freshest value
        // also do this before setting the instance... just in case :)
        this._promise = Promise.resolve(res);
        this._activeFactoryPromise = null;

        this._instance = res;

        this._expireTracker?.restart();

        return res;
    }

    /**
     * Refreshes the value by re-executing the factory function.
     *
     * **Key behaviors:**
     * 1. If initial load is in progress, it will be superseded by the refresh
     * 2. If another refresh is in progress, it will be superseded by this refresh (latest wins)
     * 3. Anyone awaiting `lazy.promise` will receive the refreshed value
     * 4. Multiple concurrent refresh calls are handled - only the latest one updates the instance
     *
     * @returns Promise that resolves to the refreshed value
     */
    public async refresh(): Promise<T> {
        this.startLoading(true);
        return this._promise!;
    }

    public reset() {
        this._isLoading = null;
        this.clearError();

        const wasDisposed = tryDispose(this._instance);

        this._instance = this._initial;

        const p = this._promise;
        this._promise = undefined;
        this._activeFactoryPromise = null; // Clear active promise reference

        // check if loading is still in progress
        // need to dispose abandoned value
        if (p && !wasDisposed) {
            p.then(value => {
                tryDispose(value);
            });
        }
    }

    public dispose() {
        this._ownDisposer?.();
        this.reset();
    }

    protected ensureInstanceLoading() {
        if (this.isLoading === false && this._instance !== undefined && this._expireTracker?.isExpired) {
            // do not reset the instance, just make sure it will be reloaded
            this._isLoading = null;
        }

        if (this._isLoading === null) {
            this._isLoading = true;
            this.startLoading(false);
        }
    }

    private startLoading(refreshing: boolean) {
        if (!refreshing && this._activeFactoryPromise) {
            // Case when refreshing already is happening - we have an active promise
            return;
        }

        const factoryPromise: Promise<T> = this._factory(refreshing)
            .then(res => {
                if (!this._activeFactoryPromise) {
                    // this promise was abandoned: was superseded or reset called
                    return this._instance ?? this._initial as T;
                }

                if (this._activeFactoryPromise === factoryPromise) {
                    // case: during the promise `setInstance` was called manually
                    if (!refreshing && !this._isLoading && this._instance !== undefined) {
                        return this._instance;
                    }
                    this.setInstance(res);
                    return res;
                }

                // Stale promise - return the latest active promise instead
                // This ensures anyone awaiting this old promise gets the fresh value
                return this._activeFactoryPromise;
            })
            .catch(err => {
                if (!this._activeFactoryPromise || this._activeFactoryPromise === factoryPromise) {
                    return this.onRejected(err) as T;
                }
                throw err;
            });

        const hadActive = !!this._activeFactoryPromise;

        // This is now the active promise - any previous one is superseded
        this._activeFactoryPromise = factoryPromise;

        // don't overwrite an existing promise (e.g., from refresh)
        // it should pick up the new active promise automatically
        if (!this._promise || !hadActive) {
            this._promise = factoryPromise;
        }
    }

    // protected onResolved(res: T) {

    // }

    protected onRejected(e: unknown): T | TInitial {
        this._isLoading = false;
        // Keep the current instance on error (don't reset to initial)
        // This allows retaining the last successful value
        const currentInstance = this._instance !== undefined ? this._instance : this._initial;
        this._promise = Promise.resolve(currentInstance) as Promise<T>;
        this._activeFactoryPromise = null;
        this.setError(e);
        return currentInstance as T;
    }

    protected setError(err: unknown) {
        this._error = this.parseError(err);
    }

    protected clearError() {
        this._error = null;
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
