module.exports = {
    "env": {
        "es6": true,
        "node": true,
    },
    "plugins": [
        "@typescript-eslint",
    ],
    "parser": "@typescript-eslint/parser",
    "extends": [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended-type-checked'
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
        "@typescript-eslint/no-unused-vars": [1, { "argsIgnorePattern": "^_" }],
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
        // the following are from stricter mode so consider enabling them
        '@typescript-eslint/no-floating-promises': 0,
        '@typescript-eslint/no-unsafe-return': 0,
        '@typescript-eslint/no-unsafe-argument': 0, // may be useful but it gets too noisy
        '@typescript-eslint/no-unsafe-assignment': 0,
        '@typescript-eslint/no-unsafe-member-access': 0,
        '@typescript-eslint/no-unsafe-call': 0,
        '@typescript-eslint/no-namespace': 0,
        '@typescript-eslint/unbound-method': [0, { ignoreStatic: true }],
        'prefer-spread': 0,
        "@typescript-eslint/func-call-spacing": 1,

        '@typescript-eslint/require-await': 0,


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
        "no-undef": 0,
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
        "object-curly-spacing": ["warn", "always"],
    },
};
