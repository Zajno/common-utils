import { tryDispose, type IDisposable } from '../functions/disposer.js';
import type { IResettableModel } from '../models/types.js';
import type { IExpireTracker } from '../structures/expire.js';
import type { IControllableLazyPromise, ILazyPromiseExtension, LazyFactory } from './types.js';

/**
 * Asynchronous lazy-loading container that initializes via a promise-based factory.
 * Handles concurrent operations with "latest wins" semantics: multiple refreshes are automatically
 * coordinated so all awaiting promises receive the final value. Supports extensions for custom behavior.
 */
export class LazyPromise<T, TInitial extends T | undefined = undefined> implements IControllableLazyPromise<T, TInitial>, IDisposable, IResettableModel {

    private _factory: LazyFactory<T>;
    private readonly _initial: TInitial;

    private _instance: T | TInitial;

    /** Current loading state: true = loading, false = loaded, null = not started */
    private _state: boolean | null = null;

    private _isAsyncStateChange = false;

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

    /** Current loading state: true = loading, false = loaded, null = not started */
    public get isLoading() { return this._state; }
    public get hasValue() { return this._state === false; }
    public get error() { return this._error; }

    public get promise() {
        this.ensureInstanceLoading();
        return this._promise!;
    }

    get value(): T | TInitial {
        this.ensureInstanceLoading();
        return this._instance;
    }

    /** Returns current value without triggering loading. */
    public get currentValue(): T | TInitial {
        return this._instance;
    }

    /** Configures automatic cache expiration using an expire tracker. */
    public withExpire(tracker: IExpireTracker | undefined) {
        this._expireTracker = tracker;
        return this;
    }

    public withAsyncStateChange(enabled: boolean) {
        this._isAsyncStateChange = enabled;
        return this;
    }

    /**
     * Extends this instance with additional functionality via in-place mutation.
     *
     * **Capabilities:**
     * - `overrideFactory`: Wrap the factory (logging, retry, caching, etc.)
     * - `extendShape`: Add custom properties/methods
     * - `dispose`: Cleanup resources when disposed
     *
     * **Type Safety:**
     * - Use `ILazyPromiseExtension<any>` for universal extensions
     * - Use `ILazyPromiseExtension<ConcreteType>` for type-specific extensions
     *
     * **Note:** Extensions mutate the instance and can be chained.
     *
     * @param extension - Extension configuration
     * @returns The same instance with applied extensions
     *
     * @example
     * ```typescript
     * const logged = lazy.extend({
     *   overrideFactory: (factory) => async (refreshing) => {
     *     console.log('Loading...');
     *     return await factory(refreshing);
     *   }
     * });
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

    /**
     * Manually sets the value and marks loading as complete.
     * Clears any errors and restarts the expiration tracker if configured.
     *
     * @param res - The value to set
     * @returns The value that was set
     */
    public setInstance(res: T) {
        this.updateState(false);
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
     * Re-executes the factory to get fresh data.
     *
     * **Concurrency handling:**
     * - Supersedes any in-progress load or refresh
     * - Multiple concurrent refreshes: latest wins
     * - All awaiting promises receive the final refreshed value
     *
     * @returns Promise resolving to the refreshed value
     */
    public async refresh(): Promise<T> {
        this.startLoading(true);
        return this._promise!;
    }

    public reset() {
        this.updateState(null);
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

    private ensureInstanceLoading() {
        let nextState: typeof this._state | undefined;
        if (this.isLoading === false && this._instance !== undefined && this._expireTracker?.isExpired) {
            // do not reset the instance, just make sure it will be reloaded
            nextState = null;
        }

        if (this._state === null || nextState === null) {
            nextState = true;
            this.startLoading(false);
        }

        if (nextState !== undefined) {
            if (this._isAsyncStateChange) {
                setImmediate(() => { this.updateState(nextState); });
            } else {
                this.updateState(nextState);
            }
        }
    }

    private startLoading(refreshing: boolean) {
        if (!refreshing && this._activeFactoryPromise) {
            // Case when refreshing already is happening - we have an active promise
            return;
        }

        const factoryPromise: Promise<T> = Promise.resolve(this._factory(refreshing))
            .then(res => {
                if (!this._activeFactoryPromise) {
                    // this promise was abandoned: was superseded or reset called
                    return this._instance ?? this._initial as T;
                }

                if (this._activeFactoryPromise === factoryPromise) {
                    // case: during the promise `setInstance` was called manually
                    if (!refreshing && !this._state && this._instance !== undefined) {
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

    protected onRejected(e: unknown): T | TInitial {
        this.updateState(false);
        // Keep the current instance on error (don't reset to initial)
        // This allows retaining the last successful value
        const currentInstance = this._instance !== undefined ? this._instance : this._initial;
        this._promise = Promise.resolve(currentInstance) as Promise<T>;
        this._activeFactoryPromise = null;
        this.setError(e);
        return currentInstance as T;
    }

    protected updateState(isLoading: boolean | null) {
        this._state = isLoading;
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
