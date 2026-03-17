## Core Concepts

The library provides a **three-layer architecture** for Firebase Cloud Functions:

1. **Definition layer** (shared) – type-safe function contracts ([`FunctionDefinition`](./src/functions/definition.ts:8)) shared between client and server.
2. **Server layer** – [`FunctionFactory`](./src/server/functions/factory.ts:18) + [`Middleware`](./src/server/functions/middleware.ts:36) pipeline to build Firebase HTTPS Callable endpoints.
3. **Client layer** – [`FunctionFactory`](./src/client/abstractions/functions/factory.ts:21) (client) that calls the endpoint, applying arg/result processors automatically.

```
┌─────────────────────────────────────────────────────────┐
│                  Shared Definition Layer                 │
│  FunctionDefinition<TArg, TResult>                      │
│  FunctionComposite<T>                                   │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
       ┌───────▼───────┐      ┌───────▼───────┐
       │  Server Layer  │      │  Client Layer  │
       │ FunctionFactory │      │ FunctionFactory │
       │ + Middleware    │      │ + execute()    │
       └───────────────┘      └───────────────┘
```

---

## Function Definitions

[`FunctionDefinition<TArg, TResult>`](./src/functions/definition.ts:8) is the core building block. It defines a callable function's **name**, **namespace**, **runtime options**, and optional **arg/result processors** (converters).

### Creating a Definition

```ts
import { FunctionDefinition } from '@zajno/common-firebase/functions';

// Simple definition: name = 'greet', namespace = 'api'
const GreetEndpoint = new FunctionDefinition<{ name: string }, { message: string }>(
    'greet',  // Name
    'api',    // Namespace (optional)
    { timeoutSeconds: 30, memory: '256MB' }, // RuntimeOptions (optional)
);

// The callable name used by Firebase will be 'api-greet'
console.log(GreetEndpoint.CallableName); // => 'api-greet'
```

### Arg & Result Processors

Processors transform data before sending (client) or after receiving (server). Use [`specify()`](./src/functions/definition.ts:30) to create a derived definition with different types:

```ts
// Original definition works with raw DB types
const GetUser = new FunctionDefinition<{ uid: string }, { name: string; createdAt: number }>('getUser');

// Create a client-friendly version that converts the result
const GetUserClient = GetUser.specify<
    { uid: string },           // same arg type
    { name: string; createdAt: Date }  // different result type
>(
    undefined, // no arg conversion needed
    (raw) => ({ ...raw, createdAt: new Date(raw.createdAt) }),
);
```

### Key Properties

| Property | Description |
|---|---|
| [`Name`](./src/functions/definition.ts:23) | Function name |
| [`Namespace`](./src/functions/definition.ts:24) | Optional namespace prefix |
| [`CallableName`](./src/functions/definition.ts:21) | Combined `namespace-name` (or just `name` if no namespace) |
| [`Options`](./src/functions/definition.ts:25) | Firebase runtime options (`memory`, `timeoutSeconds`, etc.) |
| [`ArgProcessor`](./src/functions/definition.ts:17) | Transforms input arguments |
| [`ResultProcessor`](./src/functions/definition.ts:18) | Transforms output results |

---

## Composite Functions

[`FunctionComposite<T>`](./src/functions/composite.ts:42) allows defining **multiple logical endpoints** under a single Firebase Function. This reduces the number of deployed functions while maintaining type safety.

### Why Composite?

Firebase charges per function deployment and cold starts affect each function independently. By grouping related endpoints into one function, you reduce cold starts and deployment overhead.

### Defining a Composite Endpoint

Use [`spec<TArg, TResult>()`](./src/functions/composite.ts:9) to declare each sub-endpoint's type signature:

```ts
import { FunctionComposite, spec, createCompositionExport } from '@zajno/common-firebase/functions/composite';

// Define the API shape with typed specs
const api = {
    getUser: spec<{ uid: string }, { name: string }>(),
    updateProfile: spec<{ uid: string; name: string }, { ok: boolean }>(),
    // Nested namespaces are supported
    admin: {
        deleteUser: spec<{ uid: string }, void>(),
        listUsers: spec<{ page: number }, { users: string[] }>(),
    },
};

// Create the composite and export it
export const UserAPI = createCompositionExport(
    new FunctionComposite(api, 'users', 'v1'),
    //                          ^ name   ^ namespace
);
```

### Accessing Individual Specs

The [`createCompositionExport()`](./src/functions/composite.ts:99) helper returns a callable that also exposes each spec as a property. Each spec is a full [`IFunctionDefinition`](./src/functions/interface.ts:18) with automatic arg/result wrapping:

```ts
// Access individual endpoint definitions (for client-side use)
UserAPI.getUser          // IFunctionDefinition<{ uid: string }, { name: string }>
UserAPI.admin.deleteUser // IFunctionDefinition<{ uid: string }, void>

// Access the root composite
UserAPI()                // FunctionComposite<typeof api>
```

### How Arg/Result Processors Work in Composites

When calling `UserAPI.getUser` from the client, the arg processor automatically wraps the argument:

```ts
// Input:  { uid: '123' }
// Sent:   { getUser: { uid: '123' } }

// Received: { getUser: { name: 'Alice' } }
// Output:   { name: 'Alice' }
```

For nested specs like `UserAPI.admin.deleteUser`:

```ts
// Input:  { uid: '123' }
// Sent:   { admin: { deleteUser: { uid: '123' } } }
```

---

## Middleware System

The [`Middleware<TArg, TResult, TContext>`](./src/server/functions/middleware.ts:36) class implements a **Koa-style middleware chain** for processing function requests on the server side.

### How It Works

Each middleware handler receives a [`HandlerContext`](./src/server/functions/interface.ts:19) and a `next` function. The context carries `input`, `output`, auth info, logger, and custom `data`:

```ts
import { Middleware } from '@zajno/common-firebase/server/functions/middleware';

const myMiddleware = new Middleware<string, string>()
    .use(async (ctx, next) => {
        console.log('Before:', ctx.input);
        await next(); // call next middleware in chain
        console.log('After:', ctx.output);
    })
    .useFunction(async (input) => {
        return input.toUpperCase(); // sets ctx.output
    });
```

### Adding Handlers

| Method | Description |
|---|---|
| [`.use(handler)`](./src/server/functions/middleware.ts:83) | Add a middleware handler `(ctx, next) => Promise<void>`. **Must call `next()`**. |
| [`.useBeforeAll(handler)`](./src/server/functions/middleware.ts:89) | Prepend a handler before all existing ones. |
| [`.useHandler(handler)`](./src/server/functions/middleware.ts:95) | Add a handler `(ctx) => Promise<void>` that auto-calls `next()`. |
| [`.useFunction(func)`](./src/server/functions/middleware.ts:99) | Add an endpoint function `(input, ctx) => Promise<output>` that sets `ctx.output` and auto-calls `next()`. |
| [`.useAuth()`](./src/server/functions/middleware.ts:103) | Add built-in authentication check (throws if `ctx.auth.uid` is missing). |
| [`.useContextPopulist(fn)`](./src/server/functions/middleware.ts:107) | Add a context populator that enriches `ctx` before downstream handlers. |

### Safe Next Enforcement

The middleware system enforces that every `.use()` handler **must call `next()`**. If a handler forgets to call `next()`, an error is thrown at runtime. Handlers added via `.useHandler()` and `.useFunction()` auto-call `next()` and are exempt from this check.

### Custom Context

Middlewares support a generic `TContext` type parameter for attaching custom data to the context via `ctx.data`:

```ts
type MyContext = { currentUser: { id: string; role: string } };

const middleware = new Middleware<InputType, OutputType, MyContext>()
    .useContextPopulist(async (ctx) => {
        // Populate custom context data
        ctx.data = {
            currentUser: await fetchUser(ctx.auth!.uid),
        };
    })
    .useFunction(async (input, ctx) => {
        // Access custom context
        const user = ctx.data!.currentUser;
        return { greeting: `Hello, ${user.role} ${input.name}` };
    });
```

Use [`.mergeContext<C>()`](./src/server/functions/middleware.ts:114) to combine multiple context types when composing middlewares from different modules.

### Aggregating Middlewares

[`Middleware.aggregate()`](./src/server/functions/middleware.ts:231) combines multiple middleware instances so that a single `.use()` call applies to all of them:

```ts
import { Middleware } from '@zajno/common-firebase/server/functions/middleware';

// Apply the same auth + context middleware to multiple handlers
Middleware.aggregate(handlers.getUser, handlers.updateProfile)
    .useAuth()
    .useContextPopulist(populateCurrentUser);
```

---

## `FunctionFactory` – Server-Side Endpoint Construction

[`FunctionFactory<TArg, TResult, TContext>`](./src/server/functions/factory.ts:18) extends `Middleware` and creates a Firebase HTTPS Callable endpoint from a [`FunctionDefinition`](./src/functions/definition.ts:8).

### Basic Usage

```ts
import { FunctionDefinition } from '@zajno/common-firebase/functions';
import { FunctionFactory } from '@zajno/common-firebase/server/functions/factory';
import { IFirebaseFunction } from '@zajno/common-firebase/server/functions/interface';

const GreetDef = new FunctionDefinition<{ name: string }, { message: string }>('greet', 'api');

const GreetFunction = new FunctionFactory(GreetDef)
    .useAuth()
    .useFunction(async (input) => {
        return { message: `Hello, ${input.name}!` };
    });

// Export for Firebase
const endpoints = {};
IFirebaseFunction.addTo(endpoints, true, GreetFunction);
// => endpoints.api.greet is the Firebase HttpsFunction
module.exports = endpoints;
```

### Features

- **Automatic error handling**: wraps all errors into [`HttpsError`](./src/server/utils/AppHttpError.ts:34) via [`tryConvertToHttpError()`](./src/server/utils/LogicErrorAdapter.ts:27).
- **Request logging**: generates a unique request ID and logger per invocation (configurable via [`.setLogging()`](./src/server/functions/factory.ts:44)).
- **Meta support**: extracts `__meta` from input data for cross-cutting concerns.
- **Error logging**: controlled by [`FunctionFactory.DefaultLogErrors`](./src/server/functions/factory.ts:25) (default: `true`).

### Global Runtime Options

Set default runtime options for all functions via [`GlobalRuntimeOptions`](./src/server/functions/globalSettings.ts:4):

```ts
import { GlobalRuntimeOptions } from '@zajno/common-firebase/server/functions/globalSettings';

GlobalRuntimeOptions.value = {
    timeoutSeconds: 120,
    memory: '512MB',
};
```

---

## `FunctionCompositeFactory` – Server-Side Composite Handling

[`FunctionCompositeFactory<T, TContext>`](./src/server/functions/composite.ts:38) extends `FunctionFactory` to handle composite endpoints. It creates a **handlers map** mirroring the composite's shape, where each leaf is a [`MiddlewareChild`](./src/server/functions/middleware.ts:125).

### Basic Setup

```ts
import { FunctionCompositeFactory } from '@zajno/common-firebase/server/functions/composite';
import { IFirebaseFunction } from '@zajno/common-firebase/server/functions/interface';
import { UserAPI } from './definitions'; // from the composite example above

// Create the factory
const UserEndpoint = new FunctionCompositeFactory(UserAPI());

// Add global middleware (applies to all sub-endpoints)
UserEndpoint.handlers.useAuth();

// Add handlers for individual endpoints
UserEndpoint.handlers.getUser
    .useFunction(async (input, ctx) => {
        const user = await db.getUser(input.uid);
        return { name: user.name };
    });

UserEndpoint.handlers.updateProfile
    .useFunction(async (input) => {
        await db.updateProfile(input.uid, input.name);
        return { ok: true };
    });

// Nested handlers
UserEndpoint.handlers.admin.deleteUser
    .useFunction(async (input) => {
        await db.deleteUser(input.uid);
    });

UserEndpoint.handlers.admin.listUsers
    .useFunction(async (input) => {
        return { users: await db.listUsers(input.page) };
    });

// Export
const endpoints = {};
IFirebaseFunction.addTo(endpoints, true, UserEndpoint);
```

### Skipping Parent Middlewares

Individual handlers can opt out of parent middleware chains using [`.skipParentMiddlewares()`](./src/server/functions/middleware.ts:135):

```ts
// This endpoint won't require auth
UserEndpoint.handlers.getUser
    .skipParentMiddlewares()
    .useFunction(async (input) => {
        return { name: 'Public User' };
    });
```

### Using Functions Map

Instead of configuring handlers one by one, use [`.useFunctionsMap()`](./src/server/functions/composite.ts:177) to assign all endpoint functions at once:

```ts
UserEndpoint.useFunctionsMap({
    getUser: async (input) => ({ name: 'Alice' }),
    updateProfile: async (input) => ({ ok: true }),
    admin: {
        deleteUser: async (input) => { /* ... */ },
        listUsers: async (input) => ({ users: [] }),
    },
});
```

### Cloning

Use [`.clone()`](./src/server/functions/composite.ts:189) to create a copy of the factory with the same handler configuration (useful for testing or creating variants).

---

## Async Loaders

The [loader utilities](./src/server/functions/loader.ts) help with **lazy-loading** function implementations to reduce cold-start times. The actual handler code is loaded only on the first invocation.

### `useAsyncInitLoader`

[`useAsyncInitLoader()`](./src/server/functions/loader.ts:19) lazily initializes a middleware with an async loader:

```ts
import { useAsyncInitLoader } from '@zajno/common-firebase/server/functions/loader';

const MyEndpoint = new FunctionCompositeFactory(MyAPI());

useAsyncInitLoader(MyEndpoint.asMiddleware, async () => {
    // This runs once on first invocation
    const db = await initializeDatabase();

    return (middleware) => {
        middleware.handlers.useAuth();
        middleware.handlers.doSomething
            .useFunction(async (input) => db.query(input));
    };
});
```

### `useAsyncInitCompositionLoader`

[`useAsyncInitCompositionLoader()`](./src/server/functions/loader.ts:35) is a convenience wrapper for composite factories:

```ts
import { useAsyncInitCompositionLoader } from '@zajno/common-firebase/server/functions/loader';

useAsyncInitCompositionLoader(MyEndpoint.asMiddleware, async () => {
    return (handlers) => {
        handlers.useAuth();
        handlers.doSomething.useFunction(async (input) => ({ result: input }));
    };
});
```

### `createAsyncScheduledFunction` / `createAsyncHttpsRequestFunction`

Lazy-load scheduled and HTTP request functions:

```ts
import {
    createAsyncScheduledFunction,
    createAsyncHttpsRequestFunction,
} from '@zajno/common-firebase/server/functions/loader';

// Scheduled function with lazy-loaded handler
export const dailyCleanup = createAsyncScheduledFunction(
    'every 24 hours',
    () => import('./handlers/cleanup').then(m => m.handler),
    { timeZone: 'UTC' },
);

// HTTP request function with lazy-loaded handler
export const webhook = createAsyncHttpsRequestFunction(
    () => import('./handlers/webhook').then(m => m.handler),
);
```

---

## Helper Functions for Creating Endpoints

The [`create.ts`](./src/server/functions/create.ts) module provides low-level factory functions:

| Function | Description |
|---|---|
| [`createHttpsCallFunction()`](./src/server/functions/create.ts:12) | Creates a Firebase HTTPS Callable function from an endpoint worker. |
| [`createHttpsRequestFunction()`](./src/server/functions/create.ts:26) | Creates a Firebase HTTPS Request function (for webhooks, REST APIs). |
| [`createScheduledFunction()`](./src/server/functions/create.ts:30) | Creates a scheduled (cron) function. |
| [`createTopicListener()`](./src/server/functions/create.ts:39) | Creates a Pub/Sub topic listener. |
| [`FilterRequestMethod()`](./src/server/functions/create.ts:50) | Middleware that filters by HTTP method (default: POST only). |

---

## Type-Safe Helpers (`SpecTo` / `ContextTo`)

The [`helpers.ts`](./src/server/functions/helpers.ts) module provides namespace utilities for type inference:

### `SpecTo`

[`SpecTo`](./src/server/functions/helpers.ts:8) helpers infer types from a function definition spec:

```ts
import { SpecTo } from '@zajno/common-firebase/server/functions';

// Create a typed handler from a spec
const myHandler = SpecTo.Handler(UserAPI.getUser, async (ctx, next) => {
    // ctx.input is typed as { uid: string }
    // ctx.output is typed as { name: string } | null
    await next();
});

// Create a typed function from a spec
const myFunction = SpecTo.Function(UserAPI.getUser, async (input, ctx) => {
    // input: { uid: string }, return: { name: string }
    return { name: 'Alice' };
});

// Create a typed middleware from a spec
const myMiddleware = SpecTo.Middleware(UserAPI.getUser);
myMiddleware.useAuth().useFunction(myFunction);
```

### `ContextTo`

[`ContextTo`](./src/server/functions/helpers.ts:31) helpers infer types from a context type:

```ts
import { ContextTo } from '@zajno/common-firebase/server/functions';

type MyContext = { currentUser: { id: string } };
const DefaultContext: MyContext = null as any; // type marker

// Create a typed context populist
const populateUser = ContextTo.Populist(DefaultContext, async (ctx) => {
    ctx.data = { currentUser: { id: ctx.auth!.uid } };
});
```

---

## `AppHttpError` – Structured Error Responses

[`AppHttpError`](./src/server/utils/AppHttpError.ts:4) provides factory functions for creating Firebase [`HttpsError`](https://firebase.google.com/docs/reference/functions/providers_https_.httpserror) instances with standard error codes:

```ts
import AppHttpError from '@zajno/common-firebase/server/utils/AppHttpError';

// Throw structured errors in your handlers
throw AppHttpError.InvalidArguments({ name: 'email', expected: 'valid email', got: input.email });
throw AppHttpError.NotAuthenticated();
throw AppHttpError.NotFound('User not found');
throw AppHttpError.NoPermission();
throw AppHttpError.PreconditionFailed('Account not verified');
throw AppHttpError.AlreadyExists('User already exists');
throw AppHttpError.Internal('Unexpected error');

// Custom error code
throw AppHttpError.Construct('resource-exhausted', 'Rate limit exceeded');
```

---

## PubSub Manager

The [`PubSub.Manager`](./src/server/pubsub/index.ts:16) class provides a high-level API for creating and managing Pub/Sub topics with type-safe message publishing and handling.

### Setup

```ts
import { PubSub } from '@zajno/common-firebase/server/pubsub';

const pubsub = new PubSub.Manager({ projectId: 'my-project' })
    .setStrictPublishMode(true)
    .setErrorHandler((err) => console.error('PubSub error:', err));
```

### Creating Topics

```ts
type UserEvent = { userId: string; action: 'created' | 'deleted' };

const userTopic = pubsub.createTopic<UserEvent>('user-events');

// Subscribe to messages (server-side handler)
userTopic.handler.subscribe(async (data) => {
    console.log(`User ${data.userId} was ${data.action}`);
});

// Publish a message
await userTopic.publish({ userId: '123', action: 'created' });
```

### Exporting Cloud Functions

```ts
// Export all topic listeners as Cloud Functions
const topicFunctions = pubsub.exportCloudFunctions();
// Spread into your exports: module.exports = { ...topicFunctions, ...otherFunctions };
```

### Lazy Registration

Use `.addRegistration()` for handlers that need async initialization:

```ts
const topic = pubsub.createTopic<MyEvent>('my-topic');
topic.addRegistration(async () => {
    const service = await initService();
    topic.handler.subscribe((data) => service.handle(data));
});
```

---

## Client-Side Functions

The client-side [`Functions`](./src/client/web/functions.ts:41) object creates callable wrappers from function definitions:

### Calling a Simple Endpoint

```ts
import { Functions } from '@zajno/common-firebase/client/web/functions';
import { GreetDef } from './shared/definitions';

const result = await Functions.create(GreetDef).execute({ name: 'World' });
console.log(result.message); // => 'Hello, World!'
```

### Calling a Composite Endpoint

```ts
import { Functions } from '@zajno/common-firebase/client/web/functions';
import { UserAPI } from './shared/definitions';

// Each spec is a full IFunctionDefinition – use it directly
const user = await Functions.create(UserAPI.getUser).execute({ uid: '123' });
console.log(user.name);

// Nested specs work the same way
const users = await Functions.create(UserAPI.admin.listUsers).execute({ page: 1 });
console.log(users.users);
```

### Adding Metadata

Use `.addMeta()` to attach cross-cutting metadata to requests:

```ts
const worker = Functions.create(UserAPI.getUser).addMeta({ traceId: 'abc-123' });
const result = await worker.execute({ uid: '123' });
// Server receives: { getUser: { uid: '123' }, __meta: { traceId: 'abc-123' } }
```

### Emulator Support

The client automatically connects to the Firebase Functions emulator when configured:

```ts
import { FirebaseApp } from '@zajno/common-firebase/client/web/app';

FirebaseApp.Settings = {
    functionsEmulator: { url: 'http://localhost:5001' },
    // ...other settings
};
```

### Factory Hook

Use [`OnFactoryCreated`](./src/client/abstractions/functions/factory.ts:10) to intercept all function factory creations (e.g., for adding global metadata):

```ts
import { OnFactoryCreated } from '@zajno/common-firebase/client/abstractions/functions/factory';

OnFactoryCreated.subscribe((hook) => {
    hook.addMeta({ appVersion: '1.0.0' });
});
```

---

## Server Utilities

### Admin Initialization

[`Admin`](./src/server/admin.ts) auto-initializes `firebase-admin` using `GOOGLE_SERVICE_ACCOUNT` env variable or default credentials:

```ts
import Admin, { ProjectId, AdminLib } from '@zajno/common-firebase/server/admin';
```

### Firebase Logger Adapter

[`firebaseLogger`](./src/server/logger.ts:4) adapts Firebase's built-in logger to the `ILogger` interface from `@zajno/common`:

```ts
import { firebaseLogger } from '@zajno/common-firebase/server/logger';

firebaseLogger.log('Hello from Firebase Functions');
```

### `IFirebaseFunction.addTo()`

[`IFirebaseFunction.addTo()`](./src/server/functions/interface.ts:47) registers function endpoints on an export object, optionally grouping by namespace:

```ts
import { IFirebaseFunction } from '@zajno/common-firebase/server/functions/interface';

const exports = {};
IFirebaseFunction.addTo(exports, true, MyFunction1, MyFunction2);
// With namespaceLevel=true:  exports.namespace.functionName
// With namespaceLevel=false: exports.functionName
module.exports = exports;
```

---

## Full Example

See the complete working example in [`src/examples/compositeFunctionExample.ts`](./src/examples/compositeFunctionExample.ts) which demonstrates:

- Defining composite endpoints with nested namespaces
- Client-side function calls
- Server-side middleware chains with custom context
- Auth validation and context population
- Middleware aggregation across handlers
- Async initialization with `useAsyncInitLoader`
- Skipping parent middlewares for anonymous endpoints
- Exporting functions for Firebase deployment
