const base = require('./base');

const result = { ...base };

result.env = {
    ...base.env,
    "jest/globals": true,
};

result.plugins = [
    ...base.plugins,
    "jest",
];

result.extends = [
    ...base.extends,
    'plugin:jest/recommended',
    'plugin:jest/style',
];

module.exports = result;
