# PromiseCache

A key-value cache for async data that goes well beyond a simple `Map<string, Promise>`. Provide a fetcher function, and `PromiseCache` handles the rest:

- **Deduplication** — concurrent `get()` calls for the same key share a single in-flight promise
- **Synchronous access** — `getCurrent()` returns the resolved value instantly; `getDeferred()` gives a reactive handle with `current`, `promise`, `isLoading`, and `error`
- **Per-key error tracking** — fetch failures are stored, logged, and forwarded to an optional callback
- **Invalidation** — time-based TTL, custom callback, or both; with optional stale-while-revalidate (`keepInstance`)
- **Max-items eviction** — LRU-like eviction that removes invalid items first, then oldest; never evicts in-flight fetches
- **Request batching** — collects keys in a time window and dispatches a single batch call, with automatic per-key fallback on failure
- **Safe `clear()`** — a version counter prevents stale in-flight fetches from silently re-populating the cache
- **Extensible** — internal storage is created via overridable factory methods, making it easy to integrate with MobX, Vue, or other reactivity systems

## Module Structure

| File | Description |
|---|---|
| [`types.ts`](types.ts) | Type definitions — `DeferredGetter<T>`, `InvalidationCallback<T>`, `ErrorCallback<K>`, `InvalidationConfig<T>` |
| [`core.ts`](core.ts) | Abstract base class `PromiseCacheCore<T, K>` — storage, state tracking, hooks, `pure_create*` factory methods |
| [`cache.ts`](cache.ts) | Concrete implementation `PromiseCache<T, K>` — fetching, batching, invalidation, error handling, max-items eviction |
| [`index.ts`](index.ts) | Barrel re-export of all public API |

## Quick Start

```ts
import { PromiseCache } from '@zajno/common/structures/promiseCache';

// 1. Create a cache with an async fetcher
const userCache = new PromiseCache<User>(async (id: string) => {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
});

// 2. Fetch (deduplicates concurrent calls for the same key)
const user = await userCache.get('user-42');

// 3. Read synchronously (returns cached value or undefined; triggers fetch by default)
const current = userCache.getCurrent('user-42');

// 4. Get a deferred handle with reactive-friendly getters
const deferred = userCache.getDeferred('user-42');
deferred.current;   // T | null | undefined
deferred.isLoading; // boolean | undefined
deferred.error;     // unknown
await deferred.promise; // Promise<T | null>
```

## Non-String Keys

When the cache key type `K` is not `string`, provide a **key adapter** (serialize) and optionally a **key parser** (deserialize):

```ts
const cache = new PromiseCache<Product, number>(
    async (id) => fetchProduct(id),
    (id) => id.toString(),   // keyAdapter: K → string
    (str) => Number(str),    // keyParser: string → K
);

await cache.get(42);
cache.keysParsed(); // number[]
```

## Configuration (Fluent API)

All configuration methods return `this` for chaining.

### Batching — `useBatching()`

Collects individual `get()` calls within a short window and dispatches them as a single batch request. If the batch fails, each item falls back to the individual fetcher.

```ts
cache.useBatching(async (ids: string[]) => {
    const res = await fetch(`/api/users?ids=${ids.join(',')}`);
    return res.json(); // must return results in the same order as ids
}, 200 /* delay ms, default 200 */);
```

> **Important:** The resolved array **must** have the same order as the input `ids` array.

### Invalidation — `useInvalidation()` / `useInvalidationTime()`

```ts
// Simple time-based expiration
cache.useInvalidationTime(60_000); // 60 seconds

// Advanced config
cache.useInvalidation({
    expirationMs: 60_000,                          // time-based
    invalidationCheck: (key, value, cachedAt) => {  // callback-based
        return value?.isStale === true;
    },
    maxItems: 100,       // LRU-like eviction (invalid first, then oldest)
    keepInstance: true,   // keep stale value readable while re-fetching
});

// Disable invalidation
cache.useInvalidation(null);
```

The config object is stored **by reference** (not destructured), so getter-based fields are re-evaluated on every access — enabling dynamic invalidation policies:

```ts
let ttl = 60_000;
cache.useInvalidation({
    get expirationMs() { return ttl; },
});
// later: ttl = 5_000; — takes effect immediately
```

### Error Callback — `useOnError()`

```ts
cache.useOnError((key, error) => {
    reportToSentry(error, { cacheKey: key });
});
```

### Logging

Inherited from `Loggable`. Attach a logger to see internal cache operations:

```ts
cache.setLoggerFactory(createLogger, 'UserCache');
// or
cache.setLogger(myLoggerInstance);
```

## API Reference

### Reading

| Method / Property | Return Type | Description |
|---|---|---|
| `get(id)` | `Promise<T \| null>` | Returns cached value or starts a fetch. Concurrent calls for the same key share one promise. |
| `getCurrent(id, initiateFetch?)` | `T \| null \| undefined` | Returns the cached value synchronously. When `initiateFetch` is `true` (default), also triggers `get()`. |
| `getDeferred(id)` | `DeferredGetter<T>` | Returns a lazy accessor object with `current`, `promise`, `isLoading`, and `error` getters. |
| `getIsLoading(id)` | `boolean \| undefined` | `true` if loading, `false` if done, `undefined` if never started (or invalidated). |
| `getIsValid(id)` | `boolean` | `true` if the item is cached **and** not invalidated. |
| `getLastError(id)` | `unknown` | Last fetch error for the key, or `null`. |
| `hasKey(id)` | `boolean` | `true` if the item is cached or a fetch was initiated. Does **not** trigger a fetch. |
| `keys()` | `string[]` | Array of all cached string keys. |
| `keys(true)` | `MapIterator<string>` | Iterator over cached string keys. |
| `keysParsed()` | `K[] \| null` | Parsed keys via `keyParser`, or `null` if no parser was provided. |
| `keysParsed(true)` | `Generator<K> \| null` | Lazy iterator of parsed keys. |

### Counts

| Property | Type | Description |
|---|---|---|
| `loadingCount` | `number` | Number of items currently being fetched. |
| `cachedCount` | `number` | Number of resolved items in cache. |
| `promisesCount` | `number` | Number of in-flight promises. |
| `invalidCount` | `number` | Number of cached items that are currently invalid/expired. |

### Mutation

| Method | Description |
|---|---|
| `invalidate(id)` | Removes the cached item, its error, and timestamp — as if it was never fetched. |
| `updateValueDirectly(id, value)` | Injects a value into the cache without fetching. |
| `sanitize()` | Removes all currently-invalid items. Returns the count of removed items. |
| `clear()` | Resets **all** state: items, statuses, promises, errors, timestamps, loading count, and batch queue. |

## Invalidation & Eviction

`InvalidationConfig<T>` controls when cached items are considered stale:

| Field | Type | Default | Description |
|---|---|---|---|
| `expirationMs` | `number \| null` | `undefined` | Time-to-live in ms. `null`/`undefined` disables time-based expiration. |
| `invalidationCheck` | `(key, value, cachedAt) => boolean` | `undefined` | Custom callback; return `true` to mark the item invalid. |
| `maxItems` | `number \| null` | `undefined` | Maximum cache size. Eviction order: invalid items first, then oldest by timestamp. In-flight items are never evicted. |
| `keepInstance` | `boolean` | `false` | When `true`, invalidated items remain readable via `getCurrent()` (stale-while-revalidate pattern). |

## Error Handling

When a fetcher throws, the error is:
1. Stored per-key in the errors map (accessible via `getLastError(id)` or `getDeferred(id).error`)
2. Logged via the attached logger
3. Forwarded to the `useOnError()` callback (if set)

The failed fetch resolves to `null` (never rejects), but the result is **not** stored in the items cache — only the error is recorded. On a subsequent successful fetch, the error is cleared by `storeResult()`.

Errors are also cleared by `invalidate()`, `sanitize()`, and `clear()`.

## Types

### `DeferredGetter<T>`

A reactive-friendly handle to a single cache entry:

```ts
type DeferredGetter<T> = {
    readonly current: T | null | undefined;
    readonly promise: Promise<T | null>;
    readonly isLoading: boolean | undefined;
    readonly error: unknown;
};
```

A static `DeferredGetter.Empty` sentinel is provided for use as a default/placeholder value.

### `InvalidationCallback<T>`

```ts
type InvalidationCallback<T> = (key: string, value: T | null | undefined, cachedAt: number) => boolean;
```

### `ErrorCallback<K>`

```ts
type ErrorCallback<K> = (key: K, error: unknown) => void;
```

## Extensibility

`PromiseCacheCore` is designed for subclassing. The `pure_create*` factory methods allow replacing internal storage with observable variants:

| Factory Method | Creates |
|---|---|
| `pure_createLoadingCount()` | `IValueModel<number>` for the loading counter |
| `pure_createItemsCache()` | `IMapModel<string, T>` for resolved items |
| `pure_createItemsStatus()` | `IMapModel<string, boolean>` for loading flags |
| `pure_createFetchCache()` | `IMapModel<string, Promise>` for in-flight promises |
| `pure_createErrorsMap()` | `IMapModel<string, unknown>` for errors |

> ⚠️ These methods are called from the constructor and **must not** reference `this` or `super` — they must be pure/const functions.

For example, the `@zajno/common-mobx` package provides `PromiseCacheObservable`, which overrides these factories with MobX observable maps and wraps mutations in MobX actions. The same pattern can be applied for Vue reactivity or any other system.

## Concurrency & Version Safety

When `clear()` is called while fetches are in-flight, the internal `_version` counter is incremented. Any fetch that started before the clear will still resolve its promise (so callers aren't left hanging), but the result is **not** stored into the cache. This prevents stale data from silently reappearing after a reset.
