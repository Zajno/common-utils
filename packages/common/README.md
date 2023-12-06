# Zajno's Toolbox

[![Coverage Status](https://coveralls.io/repos/github/Zajno/common-utils/badge.svg?branch=main)](https://coveralls.io/github/Zajno/common-utils?branch=main)

This is a library with a useful utils/helpers to share across our projects.

Doesn't pretend to be useful in outer world because probably everything is invented, tested and released to NPM already.

The motivation to have this – just to control and organize some shared code that we ever wanted to write by ourselves.


* [Math and Array extensions](./src/math/index.ts)

* [Date extensions & helpers](./src/dates/index.ts)

* [Logger interface & console implementation](./src/logger/index.ts) – create instance of logger, inject your own implementation or globally enable/disable logger instances by callling `setMode`

* Cache, EnumHelper, Event, Lazy, Pool, Throttle, Disposer

...and other more or less noteworthy stuff.

The source code is written in TypeScript, and intended to be used in TS project, so no built JS sources included.

## Usage

It can be used a git submodule if you're brave enough, but it's possible to use it as npm package (kinda) as well. In your project:

1. Install from NPM w/ yarn

```
yarn add @zajno/common
```

[`tslib`](https://www.npmjs.com/package/tslib) is the only peer dependency.

2. In your code, use each module separately:

```typescript
import logger, { ILogger } from '@zajno/common/logger';
```

### Note on imports in v1

Previously one had to import from like `@zajno/common/lib/logger` since compiling had been doing at `postinstall` time so Typescript with its config was a peer dependency. Currently it's not the case and this packages is provided with build artifacts (js + d.ts + source maps); so no need to include `/lib` part in imports anymore.

Although install time has been decreased, the main downside is that sources are built being targeted on [ES2019 & CommonJS](./tsconfig.json#L13-L14) (for now!). This might be not always suitable and/or optimal for all build setups.

## Local development

If you plan to update the sources while using it in your project, we'd recommend using [`yalc`](https://www.npmjs.com/package/yalc). It does some magic to allow both using it in your project and updating it.

The flow will look like the following. [1] – operations made on this project, [2] – operations made on dependant project.

1. install `yalc` globally
2. `[1]` fork (if you're outside Zajno) and clone this project, do `yarn`
3. `[1]` run `yalc publish --private`
4. `[2]` run `yalc add @zajno/common && yarn`
5. `[1]` make changes in local copy, run tests etc.
6. `[1]` run some magic: `yarn push:local` – this should deliver your updated copy to local project(s) [2]
7. `[2]` notice the changes in your project, repeat 5-7 until you're done
8. `[2]` to cleanup, run `yalc remove @zajno/common` or just `yalc remove --all`
9. `[1]` push your changes after making sure it's OK, we'd say thank you for a PR!
9. `[2]` re-add the package into your project or specify tag/commit (e.g. `yarn upgrade @zajno/common`)

## Challenges & TODOs

1. This library should be and will be updated frequently. When and how to integrate these changes? For small projects that would not be required, but for long-running ones the strategy would be essential.
2. It needs (more) tests.
