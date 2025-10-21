import type { IResettableModel } from '../models/types.js';

/** Represents a lazily loaded value. */
export interface ILazy<T> {
    /** Returns current value. If not loaded, loading is triggered. */
    readonly value: T;

    /** Returns whether has current value. Accessing this property does not trigger loading. */
    readonly hasValue: boolean;

    /** Returns current value or undefined if not present. Accessing this property does not trigger loading. */
    readonly currentValue: T | undefined;

    /** Returns error message if loading failed, null otherwise. Accessing this property does not trigger loading. */
    readonly error: string | null;
}

/** Represents a lazily asynchronously loaded value. */
export interface ILazyPromise<T, TInitial extends T | undefined = undefined> extends ILazy<T | TInitial> {
    /**
     * Returns true if loading is in progress, false if loading is completed, null if loading was not initiated.
     *
     * Accessing this property does not trigger loading.
     */
    readonly isLoading: boolean | null;

    /** Returns the promise for the current value. If not loaded, accessing this property triggers loading. */
    readonly promise: Promise<T>;

    /**
     * Refreshes the value by re-executing the factory function.
     * The factory will be called with `refreshing: true` parameter.
     * If multiple refreshes are called concurrently, only the last one will update the instance.
     *
     * **⚠️ Use sparingly:** This method should only be called when you explicitly need fresh data.
     * Over-using refresh defeats the purpose of lazy loading and caching.
     *
     * **Common valid use cases:**
     * - User-initiated refresh action (pull-to-refresh, refresh button)
     * - Cache invalidation after a mutation (e.g., after updating data on server)
     * - Time-based refresh with proper debouncing/throttling
     * - Recovery from an error state
     *
     * **Anti-patterns to avoid:**
     * - Calling refresh on every render or component mount
     * - Using refresh instead of proper cache expiration (use `withExpire` instead)
     * - Calling refresh in loops or high-frequency events without debouncing
     * - Using refresh as a substitute for real-time updates (consider WebSockets/polling instead)
     *
     * @returns Promise that resolves to the refreshed value, or current value if refresh fails.
     */
    refresh(): Promise<T>;
}

/**
 * Represents a controllable lazy promise with manual state management capabilities.
 * Extends ILazyPromise and IResettableModel with methods to manually set values and reset state.
 * Use this interface in extensions that need direct control over the lazy value lifecycle.
 */
export interface IControllableLazyPromise<T, TInitial extends T | undefined = undefined>
    extends ILazyPromise<T, TInitial>, IResettableModel {
    /**
     * Manually sets the instance value and marks loading as complete.
     * Useful for cache synchronization and manual state management.
     *
     * @param value - The value to set
     * @returns The value that was set
     */
    setInstance(value: T): T;
}

/**
 * Factory function to retrieve the fresh value.
 *
 * @param refreshing - indicates whether manual refresh is requested
 * */
export type LazyFactory<T> = (refreshing?: boolean) => Promise<T>;

/**
 * Extension for LazyPromise instances.
 *
 * @template T - The type of value the extension is compatible with. Use `any` for universal extensions.
 * @template TExtShape - Additional shape added to the extended instance (properties/methods).
 *
 * @example
 * ```typescript
 * // Type-specific extension (only for numbers)
 * const doublingExtension: ILazyPromiseExtension<number> = {
 *   overrideFactory: (original) => async (refreshing) => {
 *     const result = await original(refreshing);
 *     return result * 2;
 *   }
 * };
 *
 * // Universal extension (works with any type)
 * const loggingExtension: ILazyPromiseExtension<any> = {
 *   overrideFactory: (original) => async (refreshing) => {
 *     console.log('Loading...');
 *     return await original(refreshing);
 *   }
 * };
 * ```
 */
export interface ILazyPromiseExtension<T = any, TExtShape extends object = object> {

  /**
   * Extend the instance with additional properties/methods.
   * Receives IControllableLazyPromise which includes setInstance() and reset() methods
   * for manual state management and cache synchronization.
   *
   * @param previous - The controllable LazyPromise instance to extend
   * @returns The instance with additional shape
   */
  extendShape?: <TInitial extends T | undefined = undefined>(
    previous: IControllableLazyPromise<T, TInitial>
  ) => IControllableLazyPromise<T, TInitial> & TExtShape;

  /**
   * Override or wrap the factory function.
   * @param original - The original factory function
   * @param target - The LazyPromise instance being extended
   * @returns A new factory function
   */
  overrideFactory?: <TInitial extends T | undefined = undefined>(
    original: LazyFactory<T>,
    target: ILazyPromise<T, TInitial> & TExtShape
  ) => LazyFactory<T>;

  dispose?: (instance: ILazyPromise<T, any> & TExtShape) => void;
}
