module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "jest/globals": true,
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.eslint.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint/eslint-plugin",
        "@typescript-eslint/eslint-plugin-tslint",
        "jsdoc",
        "jest",
    ],
    "extends": [
        'eslint:recommended',
        'plugin:jest/recommended',
        'plugin:jest/style',
    ],
    "rules": {
        "@typescript-eslint/dot-notation": "error",
        "@typescript-eslint/explicit-member-accessibility": [
            "off",
            {
                "accessibility": "explicit"
            }
        ],
        "@typescript-eslint/indent": "off",
        "@typescript-eslint/member-ordering": "off",
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/no-dupe-class-members": "error",
        "@typescript-eslint/no-empty-function": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "no-inner-declarations": 0,
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-unused-vars": 1,
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/quotes": [
            "error",
            "single",
            {
                "avoidEscape": true
            }
        ],
        "@typescript-eslint/semi": [
            "error",
            "always"
        ],
        "@typescript-eslint/type-annotation-spacing": "error",
        "block-spacing": 1,
        "brace-style": [
            "error",
            "1tbs",
            { "allowSingleLine": true }
        ],
        "comma-dangle": [
            "error",
            "always-multiline"
        ],
        "curly": "off",
        "default-case": "error",
        "eol-last": 1,
        "func-call-spacing": 0,
        "@typescript-eslint/func-call-spacing": 1,
        "guard-for-in": "error",
        "id-blacklist": [
            "error",
            "any",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
        ],
        "id-match": "error",
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "error",
        "jsdoc/newline-after-description": "error",
        "max-len": "off",
        "no-bitwise": "off",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "warn",
        "no-debugger": "error",
        "no-dupe-class-members": 0,
        "no-empty": "error",
        "no-eval": "error",
        "no-extra-parens": 0,
        "no-fallthrough": "error",
        "no-mixed-operators": 0,
        "no-multiple-empty-lines": "error",
        "no-multi-spaces": 1,
        "no-new-wrappers": "error",
        "no-null/no-null": "off",
        "no-redeclare": "off",
        "no-trailing-spaces": "error",
        "no-underscore-dangle": "off",
        "no-unused-labels": "error",
        "no-unused-vars": 0,
        "no-var": "error",
        "prefer-const": [
            "error",
            {
                "destructuring": "all"
            }
        ],
        "radix": "error",
        "spaced-comment": [
            "error",
            "always",
            {
                "markers": [
                    "/"
                ]
            }
        ],
        "space-in-parens": 1,
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "whitespace": [
                        true,
                        "check-branch",
                        "check-decl",
                        "check-operator",
                        "check-separator",
                        "check-type"
                    ]
                },
            }
        ],
        "object-curly-spacing": ["warn", "always"],
    },
};
