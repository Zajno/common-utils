# Zajno's Toolbox for Firebase projects

Moved from [Zajno/common-firebase](https://github.com/Zajno/common-firebase).

### Features

* Firebase client wrapper: `src/client/firebase.ts`. Don't forget to import required submodules, e.g.:

```typescript
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
```

* HTTP Functions definition wrapper: `src/functions/index.ts`
* Firestore API helpers `src/database/index.ts`
* [`AuthController`](src/client/controllers/auth.ts): client-side controller with common Firebase Authentication features
* [`StorageController`](src/client/controllers/storage.ts): client-side controller with common Firebase Storage features
