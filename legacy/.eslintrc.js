module.exports = {
    "extends": [
        "airbnb-base", "plugin:mozilla/recommended"
    ],
    "plugins": [
        "import", "mozilla"
    ],
    "rules": {
        "no-plusplus": "off",
        "func-names": "off",
        "class-methods-use-this": "off",
        "no-restricted-syntax": "off",
        "no-underscore-dangle": "off",
        "no-bitwise": "off",
        "no-unused-vars": ["error", { "vars": "all", "args": "after-used", "ignoreRestSiblings": true }],
        "default-case": "off",
    }
};
