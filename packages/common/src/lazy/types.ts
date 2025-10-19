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
};

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
};
