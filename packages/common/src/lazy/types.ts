import type { IResettableModel } from '../models/types.js';

/** Represents a lazily loaded value that initializes on first access. */
export interface ILazy<T> {
    /** Returns current value, triggering loading if not yet loaded. */
    readonly value: T;

    /** Returns true if value has been loaded. Does not trigger loading. */
    readonly hasValue: boolean;

    /** Returns current value or undefined if not loaded. Does not trigger loading. */
    readonly currentValue: T | undefined;

    /** Returns error message if loading failed, null otherwise. Does not trigger loading. */
    readonly error: string | null;
}

/** Represents a lazily asynchronously loaded value with promise-based access. */
export interface ILazyPromise<T, TInitial extends T | undefined = undefined> extends ILazy<T | TInitial> {
    /**
     * Returns loading state: true (loading), false (loaded), null (not started).
     * Does not trigger loading.
     */
    readonly isLoading: boolean | null;

    /** Returns the promise for the value, triggering loading if not started. */
    readonly promise: Promise<T>;

    /**
     * Re-executes the factory to get fresh data. If concurrent refreshes occur, the latest wins.
     * All awaiting promises will resolve to the final refreshed value.
     *
     * **⚠️ Use sparingly:** Only refresh when explicitly needed for fresh data.
     * Over-use defeats lazy loading and caching benefits.
     *
     * **Valid use cases:**
     * - User-initiated refresh (pull-to-refresh, refresh button)
     * - Cache invalidation after mutation
     * - Time-based refresh with throttling
     * - Error recovery
     *
     * **Avoid:**
     * - Refreshing on every render/mount
     * - Using instead of cache expiration (use `withExpire`)
     * - Calling in loops or high-frequency events without debouncing
     *
     * @returns Promise resolving to the refreshed value
     */
    refresh(): Promise<T>;
}

/**
 * Controllable lazy promise with manual state management.
 * Extends ILazyPromise with methods to manually set values and reset state.
 */
export interface IControllableLazyPromise<T, TInitial extends T | undefined = undefined>
    extends ILazyPromise<T, TInitial>, IResettableModel {
    /**
     * Manually sets the value and marks loading as complete.
     * Useful for cache synchronization and manual state updates.
     *
     * @param value - The value to set
     * @returns The value that was set
     */
    setInstance(value: T): T;
}

/**
 * Factory function that retrieves the value for LazyPromise.
 *
 * @param refreshing - True when called via refresh(), false on initial load
 */
export type LazyFactory<T> = (refreshing?: boolean) => Promise<T>;

/**
 * Extension for LazyPromise instances, enabling factory wrapping and instance augmentation.
 *
 * @template T - Value type the extension is compatible with (use `any` for universal extensions)
 * @template TExtShape - Additional properties/methods added to the instance
 *
 * @example
 * ```typescript
 * // Universal logging extension
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
   * Augment the instance with additional properties/methods.
   * Receives IControllableLazyPromise with setInstance() and reset() for manual control.
   *
   * @param previous - The controllable LazyPromise instance
   * @returns The instance with additional shape
   */
  extendShape?: <TInitial extends T | undefined = undefined>(
    previous: IControllableLazyPromise<T, TInitial>
  ) => IControllableLazyPromise<T, TInitial> & TExtShape;

  /**
   * Wrap or replace the factory function.
   *
   * @param original - The original factory function
   * @param target - The LazyPromise instance being extended
   * @returns A new factory function
   */
  overrideFactory?: <TInitial extends T | undefined = undefined>(
    original: LazyFactory<T>,
    target: ILazyPromise<T, TInitial> & TExtShape
  ) => LazyFactory<T>;

  /**
   * Cleanup function called when the LazyPromise is disposed.
   * Use for cleaning up resources (timers, subscriptions, listeners).
   * Executes in reverse order: newest extension first, oldest last.
   *
   * @param instance - The extended LazyPromise instance being disposed
   *
   * @example
   * ```typescript
   * const intervalExtension: ILazyPromiseExtension<any, { stopTimer: () => void }> = {
   *   extendShape: (instance) => {
   *     let intervalId: NodeJS.Timeout | null = null;
   *     return Object.assign(instance, {
   *       stopTimer: () => { if (intervalId) clearInterval(intervalId); }
   *     });
   *   },
   *   dispose: (instance) => instance.stopTimer()
   * };
   * ```
   */
  dispose?: (instance: ILazyPromise<T, any> & TExtShape) => void;
}
