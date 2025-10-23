# Zajno's Toolbox

[![Coverage Status](https://coveralls.io/repos/github/Zajno/common-utils/badge.svg?branch=main)](https://coveralls.io/github/Zajno/common-utils?branch=main)

This is a library with a useful utils/helpers to share across our projects.

The motivation to have this – just to control and organize some shared code that we ever wanted to write by ourselves.

## Contents

* [API](./src/api/index.ts): a middle-layer REST API endpoints definition helpers, to have communication described declarative & type-safely.

* [Async](./src/async)
    * [Timeouts](./src/async/timeout.ts): a promisified `setTimeout` - `setTimeoutAsync`; `timeoutPromise` - a promise that rejects after a timeout;
    * [ManualPromise](./src/async/manualPromise.ts): a promise that can be resolved/rejected manually;
    * [Array extensions](./src/async/arrays.ts): `someAsync`, `everyAsync`, `forEachAsync`, `mapAsync` (previously were Array.prototype extensions);

* [Date extensions & helpers](./src/dates/index.ts): operations with granularity, date formatting etc;
    * [Period](./src/dates/period.ts): a structure to work with date periods e.g. 1 day, 5 years etc;
    * [CalendarIndex](./src/dates/calendarIndex.ts): a structure to work with day, week, month indexes;
    * [Shift dates](./src/dates/shift.ts): shift dates by period, get start/end of with granularity etc;

* [Fields](./src/fields/index.ts): work with object fields: skip/filter falsy, transfer falsy/changed; merge arrays of objects.

* [Functions](./src/functions): [`assert`](./src/functions/assert.ts), [`IDisposable`/`Disposable`/`Disposer`](./src/functions/disposer.ts), [`DebounceAction`/`DebounceProcessor`](./src/functions/debounce.ts).

* [Lazy](./src/lazy): [`Lazy`](./src/lazy/singleton.ts) (sync), [`LazyPromise`](./src/lazy/promise.ts).

* [Logger interface & console implementation](./src/logger/index.ts): create instance of logger, inject your own implementation or globally enable/disable logger instances by calling `setMode`.

* [Math](./src/math/index.ts)
    * [General helpers](./src/math/calc.ts): `clamp`, `round`, `random`, intersections helpers and more;
    * [Array helpers]('./src/math/arrays.ts'): compare, max, min, average, count, normalize, shuffle, etc;
    * [Math Objects helpers](./src/math/object/index.ts): do arithmetical operations on objects with number fields;
    * [Distribution](./src/math/distribution.ts): simple distribution by a type;

* [Models](./src/models/): helpers for moving on towards OOP world.
    - [`EntityWithStatus`](./src/models/EntityWithStatus.ts): a base class for entities with a string status, keeps history of status changes;
    - [`Model`](./src/models/Model.ts): a simple base class (box) for `value`s setter/getter;
    - [`LoadingModel`](./src/models/Loading.ts): aggregates multiple loading flags into one;
    - [`LogicModel`](./src/models/LogicModel.ts): a helper base class which helps to run async logic with `PromiseExtended` (see below);
    - various interfaces and helpers for models.

* [Observing](./src/observing)
    - [`Event`](./src/observing/event.ts): a simple event emitter;
    - [`OneTimeLateEvent`](./src/observing/event.late.ts): an event emitter that can be listened to after it's been emitted;
    - Others: `DebouncedEvent`, `Timer`, `ProgressTracker` and more.

* [Storage](./src/storage/index.ts): abstractions + helpers for sync/async storages;

* [Structures](./src/structures)
    - [`Path`](./src/structures/path/index.ts): a helper to build (almost) type-safe dynamic paths (useful for routing definitions);
    - [`Queues`](./src/structures/queue/): [`ParallelQueue`](./src/structures/queue/parallel.ts) (helps run & track multiple prioritized async tasks), [`TasksQueue`](./src/structures/queue/tasks.ts) (a simple queue for async tasks with a limit for concurrent tasks);
    - [`PromiseCache`](./src/structures/promiseCache.ts): a cache for Promise'd values; supports TTL, invalidation, custom keys, deferred getters and more;
    - [`PromiseExtended`](./src/structures/promiseExtended.ts): a Promise wrapper which never rejects but provides `onSuccess` and `onError` callbacks;
    - [`PromiseProxy`](./src/structures/promiseProxy.ts): a Promise wrapper to mimic (fake) a resolved value's properties until it's actually resolved;
    - [`Enum helpers`](./src/structures/helpers/enum.ts): `EnumHelper`, `EnumStringHelper`, `EnumBitwiseHelper`;
    - Misc: [`Pool`](./src/structures/pool.ts), [`LinkedList`](./src/structures/linkedList.ts), [`TempoCache`](./src/structures/tempoCache.ts) (invalidates sync values after a timeout), [`ExpireTracker`](./src/structures/expire.ts), [`NamesHelper`](./src/structures/helpers/name.ts) and more.

* [`Types`](./src/types/index.ts): [`DeepReadonly`, `DeepMutable`, `DeepPartial`, `DeepRequired` etc.](./src/types/deep.ts), [`Getter`](./src/types/getter.ts), [`Ident`](./src/types/ident.ts) and various others.

* [`Validation`](./src/validation/index.ts): abstractions & helpers for validation.

### Tests

Tests are written with Vitest, coverage is (kinda) tracked with Coveralls. Test coverage is mainly dictated by real-world usage in the projects.

## Usage

Sources are in TypeScript, shipped as CJS & ESM modules targeted on `ES2022`.

### Distribution

There's no barrel exports, so you can import each module separately. Each `index.ts` file is outlined in generated `package.json`'s `exports` field. Might require `tslib` as a peer dependency.

The package does't really use `semver` for now, breaking changes to existing modules can be introduced in minor versions, so it's recommended to use `~` in your `package.json`'s dependencies. New modules can be introduced in minor & patch versions.

### Install

1. Install from NPM:

```
npm i @zajno/common
```

2. In your code, use each module separately:

```typescript
import logger, { ILogger } from '@zajno/common/logger';
```

### Local development (a guide to Yalc)

If you plan to update the sources while using it in your project, we'd recommend using [`yalc`](https://www.npmjs.com/package/yalc). It does some magic to allow both using it in your project and updating it.

The flow will look like the following. [1] – operations made on this project, [2] – operations made on dependant project.

1. install `yalc` globally
2. `[1]` fork (if you're outside Zajno) and clone this project, do `npm i`
3. `[1]` run `yalc publish --private`
4. `[2]` run `yalc add @zajno/common && npm i`
5. `[1]` make changes in local copy, run tests etc.
6. `[1]` run some magic: `npm run publish:local` – this should deliver your updated copy to local project(s) [2]
7. `[2]` notice the changes in your project, repeat 5-7 until you're done
8. `[2]` to cleanup, run `yalc remove @zajno/common` or just `yalc remove --all`
9. `[1]` push your changes after making sure it's OK, we'd say thank you for a PR!
9. `[2]` re-add the package into your project or specify tag/commit (e.g. `npm upgrade @zajno/common`)
