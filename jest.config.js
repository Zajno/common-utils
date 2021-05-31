module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/?(*.)+(spec|test).+(ts|tsx|js)',
    ],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    modulePaths: ['<rootDir>/'],
    modulePathIgnorePatterns: ['<rootDir>/package.json', 'node_modules'],
    moduleNameMapper: {
    },
};
