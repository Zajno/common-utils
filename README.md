# Zajno's Toolbox

This is a library with a useful utils/helpers to share across our projects.

Doesn't pretend to be useful in outer world because probably everything is invented, tested and released to NPM already.

The motivation to have this – just to control and organize some shared code that we ever wanted to write by ourselves.


* [Math and Array extensions](./src/math/index.ts)
* [Date extensions & helpers](./src/dates/index.ts)
* [Logger interface & console implementation](./src/logger/index.ts)
* [Localization](./src/services/localization/LocalizationManager.ts) – attempt to have a simple runtime i18n manager
* Cache, EnumHelper, Event, Lazy, Pool, Throttle, Unsubscriber

...and other more or less noteworthy stuff.

The source code is written in TypeScript, and intended to be used in TS project, so no built JS sources included.


## Usage

It can be used a git submodule if you're brave enough, but it's possible to use it as npm package (kinda) as well. In your project:

1. Add it directly from GitHub

```
yarn add git+https://github.com/Zajno/common-utils.git
```

2. In your code, use each module separately:

```typescript
import logger, { ILogger } from '@zajno/common/lib/logger';
```

[TODO] It doesn't look elegant to import with `/lib/` path part. The problem is that there's no general entry point in this package, and `typescript` doesn't work with `package.json`'s `exports` fields yet.

If you have any improvements/suggestions/questions about the flow above – feel free to raise an issue or contact us.

## Local development

If you plan to update the sources while using it in your project, we'd recommend using [`yalc`](https://www.npmjs.com/package/yalc). It does some magic to allow both using it in your project and updating it.

The flow will look like this:

1. install `yalc` globally
2. fork (if you're outside Zajno) and clone this project, do `yarn`
3. run `yalc publish --private`
4. in your project run `yalc add @zajno/common && yarn`
5. make changes in this package local copy, run tests and then `yalc push --private`
6. in your project run

```
yalc remove @zajno/common && yarn && yalc add @zajno/common && yarn
```

– this is a workaround of [this yalc issue](https://github.com/wclr/yalc/issues/100)

7. repeat 5-7 until you're done
8. create a PR in this repo, wait until it get merged (optional)
9. re-add the package into your project (or specify tag/commit)

## Challenges & TODOs

1. This library should be and will be updated frequently. When and how to integrate these changes? For small projects that would not be required, but for long-running once would be essential.
2. It needs [more] tests.
