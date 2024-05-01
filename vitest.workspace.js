import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/common/vitest.config.mts',
  './packages/common-firebase/vitest.config.mts',
  './packages/common-mobx/vitest.config.mts',
  './vitest.config.mts',
]);
