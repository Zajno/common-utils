# Zajno ESLint config

Used as base ESLint config for all Zajno projects.

See [the config](./base.mjs) for more details.

Requires `eslint@^9`.

Usage with flat eslint config:

```js
import zajno from '@zajno/eslint-config';

export default [
    ...zajno,
    {
        /* your settings */
    },
];
```
