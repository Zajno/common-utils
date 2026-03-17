# Zajno's Toolbox for Firebase projects

Moved from [Zajno/common-firebase](https://github.com/Zajno/common-firebase).

Extension for [`@zajno/common`](../common), which adds more tools for development projects based on [Firebase](https://firebase.google.com/).

## Installation

```
npm i @zajno/common-firebase
```

See usage & distribution notes from `@zajno/common`'s [README](../common/README.md#usage).

## Contents

* [Firebase Client wrapper](./src/client/web/index.ts) – a wrapper for [`firebase js sdk`](https://github.com/firebase/firebase-js-sdk) v9+ (modular API). Can help managing instance settings from one place while keeping the modular approach.

    * [HTTP Functions call wrapper](./src/client/web/functions.ts)
    * [`AuthController`](./src/client/web/auth/controller.ts): client-side controller with common Firebase Authentication features
    * [`StorageController`](src/client/controllers/storage.ts): client-side controller with common Firebase Storage features

* [Firestore helpers](./src/database/firestore/index.ts)
* [Realtime DB helpers](./src/database/realtime/index.ts)
* [HTTP Functions definitions](#function-definitions) – abstract definitions to be used on a middle-layer with in/out type definitions.
    * [Composite functions](#composite-functions) – abstraction for defining multiple logic endpoints on a single Firebase Function.

* [Server-side helpers](./src/server/) – for Firebase Functions
    * [Functions Wrapper](#functionfactory--server-side-endpoint-construction): construct functions (v1) from Endpoint definitions, with [`Middlewares`](#middleware-system) for code reuse and better readability.
    * [Composite Factory](#functioncompositefactory--server-side-composite-handling): server-side handler for composite endpoints.
    * [Async Loaders](#async-loaders): lazy-load function handlers for cold-start optimization.
    * [Pubsub helpers](#pubsub-manager) – for Firebase Pub/Sub topics.
    * Various: [`Storage`](./src/server/storage.ts), [`Admin`](./src/server/admin.ts), [`Logger`](./src/server/logger.ts) and more.

See full Functions API reference in [docs](./docs/functions.md).
