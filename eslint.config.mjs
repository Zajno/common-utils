import zajno from '@zajno/eslint-config';

export default [
    ...zajno,
    {
        ignores: [
            '**/node_modules/**/*',
            '**/dist/**/*',
            '.eslintrc.js',
            '**/vitest.config.mts',
            'packages/scripts/**/*',
        ],
    },
];
