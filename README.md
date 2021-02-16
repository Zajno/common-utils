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
# SSH
yarn add git+ssh://git@github.com:Zajno/common-utils.git

# HTTPS
yarn add git+https://github.com/Zajno/common-utils.git
```

2. Tell TypeScript how to use it. Add to your `tsconfig.json`:

```jsonc
{
   "compilerOptions": {
      "baseUrl": ".",
      "paths": {
          // this will allow to use it via `common` alias
         "common/*": ["./node_modules/zajno-common-utils/src/*"]
      },
      "plugins": [{ "transform": "ts-nameof", "type": "raw" }]
   },
   "references": [
       // this will build it during `tsc` compilation
      { "path": "./node_modules/zajno-common-utils" }
   ]
}
```

3. If you're using the library in Node.js project (you need JS source be built to run), make sure you're using `--build` flag for `tsc` compiler – this will make projects in `references` to be built as well. Magic.
4. However, built sources are kept inside `node_modules` (not copied to your output), so we'll need to tell Node where to get it via `common` alias. We use `module-alias` package to deal with it in our Node.js project:

```typescript
// fix-ts-paths.ts
// import it at the top of your entry point
import * as ModuleAlias from 'module-alias';

// here to declare all aliases
export const aliases = {
    'server': __dirname + '/..',
    // our library's alias reference to the built sources:
    'common': 'zajno-common-utils/lib/src/',
};

ModuleAlias.addAliases(aliases);

```

Now it should be building and working within your project.

If you have any improvements/suggestions/questions about the flow above – feel free to raise an issue or contact us.

### Local development

If you plan to update the sources while using it in your project, we'd recommend using [`yalc`](https://www.npmjs.com/package/yalc). It does some magic to allow both using it in your project and updating it.

## Challenges

1. This library should be and will be updated frequently. When and how to integrate these changes? For small projects that would not be required, but for long-running once would be essential.
2. It needs more tests.
3. Usage pipeline should be simplified somehow.
