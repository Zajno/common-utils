import { defineConfig, mergeConfig } from 'vitest/config';

// @ts-ignore
const setupPath = new URL('./vitest.setup.mts', import.meta.url).toString();
// @ts-ignore
const globalSetupPath = new URL('./vitest.global.mts', import.meta.url).toString();

/** Shared base config imported by per-package vitest configs. Does NOT include `projects`. */
export const baseConfig = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'istanbul',
      enabled: true,
    },
    setupFiles: setupPath,
    globalSetup: globalSetupPath,
  },
  esbuild: {
    target: 'es2022',
  },
});

/** Root config adds `test.projects` to discover per-package configs. */
export default mergeConfig(baseConfig, defineConfig({
  test: {
    projects: [
      './packages/common/vitest.config.mts',
      './packages/common-firebase/vitest.config.mts',
      './packages/common-mobx/vitest.config.mts',
    ],
  },
}));
