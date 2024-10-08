# Zajno's Toolbox for Firebase projects

Moved from [Zajno/common-firebase](https://github.com/Zajno/common-firebase).

Extension for [`@zajno/common`](../common), which adds more tools for development projects based on [Firebase](https://firebase.google.com/).

### Contents

* [Firebase Client wrapper](./src/client/web/index.ts) - a wrapper for [`firebase js sdk`](https://github.com/firebase/firebase-js-sdk) v9+ (modular API). Can help managing instance settings from one place while keeping the modular approach.

    * [HTTP Functions call wrapper](./src/client/web/functions.ts)
    * [`AuthController`](./src/client/web/auth/controller.ts): client-side controller with common Firebase Authentication features
    * [`StorageController`](src/client/controllers/storage.ts): client-side controller with common Firebase Storage features

* [Firestore helpers](./src/database/firestore/index.ts)
* [Realtime DB helpers](./src/database/realtime/index.ts)
* [HTTP Functions definitions](./src/functions/index.ts) - abstract definitions to be used on a middle-layer with in/out type definitions.
    * [Composite functions](./src/functions/composite.ts) - abstraction for defining multiple logic endpoints on a single Firebase Function.

* [Server-side helpers](./src/server/) - for Firebase Functions
    * [Functions Wrapper](./src/server/functions/index.ts): construct functions (v1) from Endpoint definitions, defined [`Middlewares`](./src/server/functions/middleware.ts) for code reuse and better readability.
    * [Pubsub helpers](./src/server/pubsub/index.ts) - for Firebase Pubsub
    * Various: [`Storage`](./src/server/storage.ts), [`Admin`](./src/server/admin.ts), [`Logger`](./src/server/logger.ts) and more.

## Usage

Install:

```
npm i @zajno/common-firebase
```

See usage & distribution notes from `@zajno/common`'s [README](../common/README.md#usage).
