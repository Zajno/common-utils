# Firebase Functions v1 → v2 Upgrade Analysis

## Current State

The project uses `firebase-functions@^7.0.5` but imports from the **`firebase-functions/v1`** subpath. The v1 API is used in 6 source files (excluding dist/coverage):

| File | Import | What's Used |
|---|---|---|
| [`functions/interface.ts`](../src/functions/interface.ts:1) | `type { RuntimeOptions }` from `firebase-functions/v1` | [`EndpointSettings`](../src/functions/interface.ts:9) type alias |
| [`server/functions/create.ts`](../src/server/functions/create.ts:1) | `* as functions` from `firebase-functions/v1` | `functions.runWith()`, `.https.onCall()`, `.https.onRequest()`, `.pubsub.schedule()`, `.pubsub.topic()` |
| [`server/functions/interface.ts`](../src/server/functions/interface.ts:2) | `* as functions` from `firebase-functions/v1` | `functions.https.CallableContext`, `functions.HttpsFunction`, `functions.Runnable` |
| [`server/functions/loader.ts`](../src/server/functions/loader.ts:1) | `type * as functions` from `firebase-functions/v1` | `functions.RuntimeOptions`, `functions.HttpsFunction` |
| [`server/pubsub/index.ts`](../src/server/pubsub/index.ts:1) | `type { pubsub, CloudFunction }` from `firebase-functions/v1` | `CloudFunction<pubsub.Message>` type |
| [`server/utils/AppHttpError.ts`](../src/server/utils/AppHttpError.ts:2) | `{ https }` from `firebase-functions` (root) | `https.HttpsError`, `https.FunctionsErrorCode` — **already v1/v2 compatible** |
| [`server/utils/LogicErrorAdapter.ts`](../src/server/utils/LogicErrorAdapter.ts:1) | `* as functions` from `firebase-functions` (root) | `functions.https.HttpsError`, `functions.https.FunctionsErrorCode` — **already v1/v2 compatible** |
| [`server/logger.ts`](../src/server/logger.ts:2) | `{ logger }` from `firebase-functions` (root) | `logger.log`, `.warn`, `.error` — **already v1/v2 compatible** |

---

## Key v1 → v2 API Differences

### Builder pattern → Options-first pattern

```ts
// v1 (current) – builder pattern
functions.runWith(options).https.onCall((data, ctx) => { ... });

// v2 – options-first parameter
import { onCall } from 'firebase-functions/v2/https';
onCall(options, (request) => { ... });
```

### `CallableContext` → `CallableRequest`

In v2, `onCall` receives a single `CallableRequest<T>` object where `data` is a property (not a separate parameter):

```ts
// v1: (data, context) => ...  where context has .auth, .rawRequest
// v2: (request) => ...        where request has .data, .auth, .rawRequest
```

### `EventContext` removed

Scheduled functions receive `ScheduledEvent` and pubsub receives `CloudEvent<MessagePublishedData>` instead.

### `HttpsFunction` & `Runnable` types changed

v2's `onCall` returns `CallableFunction<T, R>` — a different type hierarchy. `Runnable<T>` no longer exists.

### `RuntimeOptions` → `GlobalOptions` / `HttpsOptions`

Same fields (`memory`, `timeoutSeconds`, `minInstances`) but different type names. The `failurePolicy` field used in [`EndpointSettings`](../src/functions/interface.ts:9) is **not available** in v2 HTTPS options (it was for background functions only, and was never applicable to HTTPS callables).

### Unchanged APIs ✅

- `https.HttpsError` and `https.FunctionsErrorCode` — available in both v1 and v2
- `logger` from `firebase-functions` root — same API in v2

---

## Can We Keep the Same Public Interface?

**Yes.** The library's abstraction layer is well-designed enough that the consumer-facing interface can remain identical. The v1→v2 differences are almost entirely contained within internal plumbing files.

### What consumers actually interact with

Consumers interact with library-defined types, not raw Firebase types:

- [`EndpointContext`](../src/server/functions/interface.ts:8) — `ctx.input`, `ctx.output`, `ctx.auth`, `ctx.data`, `ctx.logger`, `ctx.rawRequest`, `ctx.endpoint`, `ctx.requestId`, `ctx.requestPath`
- [`EndpointFunction`](../src/server/functions/interface.ts:17) — `(data, context) => Promise<TOut>`
- [`EndpointHandler`](../src/server/functions/interface.ts:26) — `(ctx, next) => Promise<void>`
- [`Middleware`](../src/server/functions/middleware.ts:36) — `.use()`, `.useAuth()`, `.useFunction()`, etc.
- [`FunctionFactory`](../src/server/functions/factory.ts:18) / [`FunctionCompositeFactory`](../src/server/functions/composite.ts:38)
- [`FunctionDefinition`](../src/functions/definition.ts:8) / [`FunctionComposite`](../src/functions/composite.ts:42) / `spec<>()`
- [`AppHttpError`](../src/server/utils/AppHttpError.ts:4)
- [`SpecTo`](../src/server/functions/helpers.ts:8) / [`ContextTo`](../src/server/functions/helpers.ts:31)
- Client-side `Functions.create(def).execute(arg)`

None of these expose raw Firebase v1 types to consumers.

### Capability-by-capability compatibility

| Capability | v1 Mechanism | v2 Equivalent | Breaks Interface? |
|---|---|---|---|
| **HTTPS Callable** | `runWith(opts).https.onCall((data, ctx))` | `onCall(opts, (request))` | **No** — [`createHttpsCallFunction()`](../src/server/functions/create.ts:12) already destructures `data` and `ctx` before passing to middleware |
| **HTTPS Request** | `runWith(opts).https.onRequest(handler)` | `onRequest(opts, handler)` — same `(req, res)` signature | **No** |
| **Scheduled Functions** | `runWith(opts).pubsub.schedule(expr).onRun(ctx)` | `onSchedule(opts, (event))` | **No** — adaptable internally |
| **PubSub Topics** | `runWith(opts).pubsub.topic(name).onPublish((msg, ctx))` | `onMessagePublished(opts, (event))` | **No** — [`PubSub.Manager`](../src/server/pubsub/index.ts:16) wraps this; consumers only see `handler` Event and `publish()` |
| **Auth context** | `ctx.auth` on `CallableContext` | `request.auth` on `CallableRequest` | **No** — same shape `{ uid, token }` |
| **Raw request** | `ctx.rawRequest` on `CallableContext` | `request.rawRequest` on `CallableRequest` | **No** — same property |
| **Runtime options** | `RuntimeOptions` | `HttpsOptions` / `GlobalOptions` | **Minor** — drop `failurePolicy` from `EndpointSettings` (was unused for callables) |
| **HttpsError** | `functions.https.HttpsError` | Same class, same import | **No** |
| **Logger** | `firebase-functions` root logger | Same API | **No** |

---

## Files to Change

Only **4 source files** need modification. **0 public interfaces change.**

### 1. [`src/functions/interface.ts`](../src/functions/interface.ts) — Low effort

```ts
// BEFORE
import type { RuntimeOptions } from 'firebase-functions/v1';
export type EndpointSettings = Pick<RuntimeOptions, 'memory' | 'timeoutSeconds' | 'minInstances' | 'failurePolicy'>;

// AFTER
import type { HttpsOptions } from 'firebase-functions/v2/https';
export type EndpointSettings = Pick<HttpsOptions, 'memory' | 'timeoutSeconds' | 'minInstances'>;
// Note: failurePolicy dropped — was never applicable to HTTPS callables
```

### 2. [`src/server/functions/create.ts`](../src/server/functions/create.ts) — High effort

Rewrite all 4 factory functions from builder pattern to v2 options-first pattern:

```ts
// BEFORE
import * as functions from 'firebase-functions/v1';

function getBaseBuilder(runtimeOptions) {
    return functions.runWith({ ...GlobalRuntimeOptions.value, ...runtimeOptions });
}

export function createHttpsCallFunction(worker, options) {
    return getBaseBuilder(options).https.onCall((data, ctx) => {
        const eCtx = ctx as EndpointContext;
        return worker(data, eCtx);
    });
}

// AFTER
import { onCall, onRequest, type HttpsOptions } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';

function mergeOptions(runtimeOptions?: HttpsOptions | null): HttpsOptions {
    return { ...GlobalRuntimeOptions.value, ...runtimeOptions };
}

export function createHttpsCallFunction(worker, options) {
    return onCall(mergeOptions(options), (request) => {
        // v2 CallableRequest has same .auth, .rawRequest as v1 CallableContext
        const eCtx = request as EndpointContext;
        return worker(request.data, eCtx);
    });
}

export function createHttpsRequestFunction(worker, options) {
    return onRequest(mergeOptions(options), worker);
}

export function createScheduledFunction(schedule, worker, options) {
    return onSchedule({
        schedule,
        timeZone: options?.timeZone,
        ...mergeOptions(options?.runtime),
    }, (event) => worker(event));
}

export function createTopicListener(topicName, listener, options) {
    return onMessagePublished({
        topic: topicName,
        ...mergeOptions(options),
    }, (event) => listener(event.data.message, event));
}
```

### 3. [`src/server/functions/interface.ts`](../src/server/functions/interface.ts) — High effort

```ts
// BEFORE
import * as functions from 'firebase-functions/v1';
export type BaseFunctionContext = functions.https.CallableContext;
export type FirebaseEndpoint = functions.HttpsFunction;
export type FirebaseEndpointRunnable = FirebaseEndpoint & functions.Runnable<any>;

// AFTER
import type { CallableRequest, HttpsFunction } from 'firebase-functions/v2/https';
// CallableRequest has .auth, .rawRequest, .app, .instanceIdToken — same as CallableContext
export type BaseFunctionContext = Omit<CallableRequest<any>, 'data'>;
export type FirebaseEndpoint = HttpsFunction;
export type FirebaseEndpointRunnable = FirebaseEndpoint; // v2 doesn't have Runnable
```

### 4. [`src/server/pubsub/index.ts`](../src/server/pubsub/index.ts) — Medium effort

```ts
// BEFORE
import type { pubsub, CloudFunction } from 'firebase-functions/v1';
// ...
private topicCloudFunctions: Record<string, CloudFunction<pubsub.Message>> = {};

// AFTER
import type { CloudFunction } from 'firebase-functions/v2/pubsub';
// ...
private topicCloudFunctions: Record<string, CloudFunction<any>> = {};
```

### Files that need NO changes ✅

- [`server/functions/middleware.ts`](../src/server/functions/middleware.ts) — no Firebase imports
- [`server/functions/factory.ts`](../src/server/functions/factory.ts) — uses library-defined types only
- [`server/functions/composite.ts`](../src/server/functions/composite.ts) — uses library-defined types only
- [`server/functions/helpers.ts`](../src/server/functions/helpers.ts) — uses library-defined types only
- [`server/utils/AppHttpError.ts`](../src/server/utils/AppHttpError.ts) — imports from root (compatible)
- [`server/utils/LogicErrorAdapter.ts`](../src/server/utils/LogicErrorAdapter.ts) — imports from root (compatible)
- [`server/logger.ts`](../src/server/logger.ts) — imports from root (compatible)
- All `client/` code — no server-side Firebase imports
- All `functions/` definitions — Firebase-agnostic (except `interface.ts`)
- [`server/functions/loader.ts`](../src/server/functions/loader.ts) — type-only imports, follows interface.ts types

---

## Concurrency Consideration

v2 functions support **concurrency** (multiple requests per instance). The middleware chain is safe because:

- The chain is built at deploy time and is read-only during execution
- Each invocation gets its own `HandlerContext` object (created in [`FunctionFactory.createEndpointHandler()`](../src/server/functions/factory.ts:49))

**⚠️ Note:** The [`_chainLocked`](../src/server/functions/middleware.ts:50) flag in `Middleware.execute()` is instance-level, not invocation-level. With v2 concurrency, two concurrent requests on the same `FunctionFactory` could conflict on this flag. However, this is a guard against modifying the chain during execution (not a mutex), and since the chain is fully built before the first request, this would only trigger if someone calls `.use()` during a request handler — which is already an error. Still, consider removing or making this check invocation-scoped.

---

## Versioning

This migration can be done as a **minor version bump** since the public API surface remains unchanged. However, a **major version bump** is recommended because:

1. `EndpointSettings.failurePolicy` is removed (technically a breaking type change)
2. `FirebaseEndpointRunnable` type changes (no longer includes `Runnable<any>`)
3. v2 concurrency is a behavioral change at runtime
4. Consumers who directly import from `firebase-functions/v1` in their own code alongside this library may face conflicts

---

## New Capabilities Gained

| Feature | v1 | v2 |
|---|---|---|
| Concurrency | 1 request/instance | Configurable (up to 1000) |
| Max timeout | 9 minutes | 60 minutes |
| CPU configuration | Not configurable | `cpu` option |
| CORS | Manual | Built-in `cors` option |
| App Check | Manual | Built-in `enforceAppCheck` option |
| Min instances | ✅ | ✅ |
| Secrets | `runWith({ secrets })` | `defineSecret()` + options |

---

## Dual-Version Support: Letting Consumers Choose v1 or v2

Since the v1→v2 difference is isolated to a thin adapter layer, it's possible to let consumers select which Firebase Functions version they use. Here are the approaches, from simplest to most flexible.

### Approach A: Separate Export Paths

Expose both versions as separate subpath exports. The shared middleware/factory code stays common; only the "create" and "types" layer is duplicated.

**File structure:**

```
src/server/functions/
├── interface.ts          # shared types (EndpointContext, EndpointHandler, etc.)
├── middleware.ts          # shared (no Firebase imports)
├── factory.ts             # shared (no Firebase imports)
├── composite.ts           # shared (no Firebase imports)
├── helpers.ts             # shared (no Firebase imports)
├── loader.ts              # shared (uses types from interface.ts)
├── v1/
│   ├── create.ts          # v1 builder pattern (functions.runWith().https.onCall)
│   ├── types.ts           # v1-specific types (CallableContext, HttpsFunction, Runnable)
│   └── index.ts           # re-exports shared + v1-specific
├── v2/
│   ├── create.ts          # v2 options-first (onCall, onRequest, onSchedule)
│   ├── types.ts           # v2-specific types (CallableRequest, CallableFunction)
│   └── index.ts           # re-exports shared + v2-specific
└── index.ts               # default export (could point to v1 or v2)
```

**package.json exports:**

```json
{
  "exports": {
    "./server/functions":    "./src/server/functions/index.ts",
    "./server/functions/v1": "./src/server/functions/v1/index.ts",
    "./server/functions/v2": "./src/server/functions/v2/index.ts"
  }
}
```

**Consumer usage:**

```ts
// Consumer chooses v1
import { FunctionFactory, createHttpsCallFunction } from '@zajno/common-firebase/server/functions/v1';

// Consumer chooses v2
import { FunctionFactory, createHttpsCallFunction } from '@zajno/common-firebase/server/functions/v2';
```

**Pros:**
- Clean separation, no runtime overhead
- Tree-shaking friendly — unused version is not bundled
- Consumers explicitly opt in
- Both versions can coexist in the same project (mixed migration)

**Cons:**
- Some code duplication in the `create.ts` / `types.ts` files
- Need to maintain two adapter layers
- The default `./server/functions` export needs a decision (v1 for backward compat, v2 as new default?)

---

### Approach B: Runtime Adapter Injection

Define an abstract adapter interface and let consumers inject the v1 or v2 implementation at initialization time.

**Adapter interface:**

```ts
// src/server/functions/adapter.ts
export interface IFirebaseFunctionsAdapter {
    createCallable<TData, TResult>(
        options: EndpointSettings | null,
        handler: (data: TData, context: BaseFunctionContext) => Promise<TResult>,
    ): FirebaseEndpoint;

    createRequest<TRes>(
        options: EndpointSettings | null,
        handler: (req: any, res: any) => void | Promise<void>,
    ): FirebaseEndpoint;

    createScheduled(
        schedule: string,
        options: SchedulerOptions | undefined,
        handler: (context: any) => any,
    ): any;

    createTopicListener(
        topicName: string,
        options: EndpointSettings | null,
        handler: (message: any, context: any) => any,
    ): any;
}
```

**Pre-built adapters:**

```ts
// src/server/functions/adapters/v1.ts
import * as functions from 'firebase-functions/v1';
export const v1Adapter: IFirebaseFunctionsAdapter = {
    createCallable(options, handler) {
        return functions.runWith(options ?? {}).https.onCall(handler);
    },
    // ...
};

// src/server/functions/adapters/v2.ts
import { onCall, onRequest } from 'firebase-functions/v2/https';
export const v2Adapter: IFirebaseFunctionsAdapter = {
    createCallable(options, handler) {
        return onCall(options ?? {}, (request) => handler(request.data, request));
    },
    // ...
};
```

**Consumer usage:**

```ts
import { setFunctionsAdapter } from '@zajno/common-firebase/server/functions';
import { v2Adapter } from '@zajno/common-firebase/server/functions/adapters/v2';

// Call once at startup
setFunctionsAdapter(v2Adapter);
```

**Pros:**
- Single import path for consumers
- Easy to swap at runtime (useful for testing)
- No code duplication in the shared layer

**Cons:**
- Runtime indirection (minor perf cost)
- Must be called before any function is created — ordering dependency
- Adapter imports still pull in the specific `firebase-functions/v1` or `v2` module
- Less tree-shakeable — both adapters exist in the bundle unless carefully structured

---

### Approach C: Hybrid (Recommended)

Combine both approaches: use **separate export paths** for the adapter layer, but keep a **shared adapter interface** internally so the factory/middleware code doesn't care which version is active.

**File structure:**

```
src/server/functions/
├── adapter.ts             # IFirebaseFunctionsAdapter interface
├── interface.ts           # shared types (uses adapter for Firebase-specific types)
├── middleware.ts           # shared
├── factory.ts             # shared (uses adapter via interface.ts)
├── composite.ts           # shared
├── helpers.ts             # shared
├── loader.ts              # shared
├── create.ts              # delegates to current adapter
├── globalSettings.ts      # shared
├── v1/
│   ├── adapter.ts         # v1 adapter implementation
│   └── index.ts           # sets v1 adapter + re-exports everything
├── v2/
│   ├── adapter.ts         # v2 adapter implementation
│   └── index.ts           # sets v2 adapter + re-exports everything
└── index.ts               # re-exports shared (no adapter set — consumer must use v1/ or v2/)
```

**Consumer usage:**

```ts
// Everything from one import — v2 adapter is auto-configured
import { FunctionFactory, FunctionCompositeFactory } from '@zajno/common-firebase/server/functions/v2';

// Or stick with v1
import { FunctionFactory, FunctionCompositeFactory } from '@zajno/common-firebase/server/functions/v1';
```

**Pros:**
- Clean consumer DX — just change the import path
- No runtime ordering issues — adapter is set by the module's side effect
- Shared code is truly shared (no duplication)
- Tree-shaking works — only the chosen adapter's `firebase-functions/v*` import is pulled in
- Easy to deprecate v1 later — just mark the export path as deprecated

**Cons:**
- Module-level side effect (setting the adapter on import) — but this is standard for Firebase itself
- Slightly more complex internal architecture

---

### Dual-Version Recommendation

**Approach C (Hybrid)** is the best fit for this library because:

1. The shared middleware/factory layer is the bulk of the code and shouldn't be duplicated
2. The adapter layer is tiny (4 functions in `create.ts` + a few type aliases)
3. Consumers get a clean migration path: change one import path
4. The library can default `./server/functions` to v1 initially (backward compat), then switch default to v2 in a future major version

### Migration path for consumers

```
v4.x: ./server/functions → v1 (current)
v5.0: ./server/functions/v1 and ./server/functions/v2 introduced
       ./server/functions → v1 (backward compat, deprecated)
v6.0: ./server/functions → v2 (default switched)
       ./server/functions/v1 → removed or kept as legacy
```

---

## Summary

The upgrade is **feasible with the same consumer-facing interface**. The library's clean separation between the middleware/context layer and the Firebase SDK layer makes this a contained change affecting only 4 internal files. No consumer handler code, definitions, or middleware chains need modification.

Dual-version support is achievable via the **hybrid adapter approach** (Approach C), where consumers select v1 or v2 by changing their import path from `@zajno/common-firebase/server/functions/v1` to `@zajno/common-firebase/server/functions/v2`. The shared middleware, factory, composite, and helper code remains identical regardless of which Firebase Functions version is used underneath.
