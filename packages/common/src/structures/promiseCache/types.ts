
/** Represents a state of a cached item. Holds a references to an actual state. */
export type DeferredGetter<T> = {
    /** Get current resolved value, if any, or initiates fetching. */
    readonly current: T | null | undefined;

    /** Returns a promise that resolves to the current or fetching value. */
    readonly promise: Promise<T | null>;

    /** Returns true if the item is currently being fetched. Returns undefined if fetching has not started yet. */
    readonly isLoading: boolean | undefined;

    /** Returns the last error that occurred during fetching, or null if no error occurred. */
    readonly error: unknown;
};

export namespace DeferredGetter {
    const _resolvedPromise = Promise.resolve<null>(null);

    /** Empty resolved value. */
    export const Empty = {
        get current(): null { return null; },
        get promise(): Promise<null> { return _resolvedPromise; },
        get isLoading() { return false; },
        get error() { return null; },
    } satisfies DeferredGetter<null>;
}

/**
 * Callback for deciding if a cached item is invalid by key, value, and cached timestamp.
 *
 * @param key The cache key (string).
 * @param value The cached value.
 * @param cachedAt The timestamp (ms) when the item was cached.
 * @returns `true` if the item should be considered invalid.
 */
export type InvalidationCallback<T> = (key: string, value: T | null | undefined, cachedAt: number) => boolean;

/** Callback for handling errors during fetching. */
export type ErrorCallback<K> = (key: K, error: unknown) => void;

/**
 * Configuration for cache invalidation policy.
 *
 * All fields are optional and readonly so consumers can provide dynamic data via getters.
 * The object is stored as-is (not destructured), so getter-based fields will be re-evaluated on each access.
 */
export interface InvalidationConfig<T> {
    /** Default expiration time in milliseconds for cached items. If null/undefined, time-based expiration is disabled. */
    readonly expirationMs?: number | null;

    /**
     * Optional callback that decides if an item is invalid by key, cached value, and cached timestamp.
     * Called in addition to time-based expiration.
     */
    readonly invalidationCheck?: InvalidationCallback<T> | null;

    /**
     * Maximum number of items to hold in cache. When exceeded, invalid items are cleaned up first,
     * then oldest valid items are removed to make room.
     *
     * Note: items currently being fetched (in-flight) are not evicted.
     */
    readonly maxItems?: number | null;

    /** If true, the cached item will not be removed during invalidation, but the old instance is kept. */
    readonly keepInstance?: boolean;
}
