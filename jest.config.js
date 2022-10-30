module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: [
        "./src",
    ],
    testMatch: [
        '**/__tests__/**/(*.)+(spec|test).+(ts|tsx)',
    ],
    collectCoverage: true,
    globalSetup: './global-test-setup.js',
    setupFilesAfterEnv: ["jest-extended/all"]
};