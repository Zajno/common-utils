import { mergeConfig } from 'vitest/config';
import DefaultConfig from '../../vitest.config.mts';
import tsconfigPaths from 'vite-tsconfig-paths';

export default mergeConfig(DefaultConfig, {
    plugins: [tsconfigPaths()],
});
