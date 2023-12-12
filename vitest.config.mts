import { defineConfig } from 'vitest/config';

// @ts-ignore
const setupPath = new URL('./vitest.setup.mts', import.meta.url).toString();
// @ts-ignore
const globalSetupPath = new URL('./vitest.global.mts', import.meta.url).toString();

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'istanbul',
      enabled: true,
    },
    setupFiles: setupPath,
    globalSetup: globalSetupPath,
  },
});
