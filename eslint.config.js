// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Generated: src/gql/ by GraphQL Code Generator (`npm run codegen`),
    // src/data/ by scripts/ (e.g. `npm run build:zip-districts`).
    ignores: ['dist/*', 'src/gql/*', 'src/data/*'],
  },
]);
