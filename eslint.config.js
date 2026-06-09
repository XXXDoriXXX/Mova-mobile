// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                "Deep import into a feature. Use '@/features/<feature>' (the feature's index.ts is its public API). See docs/adr/0004-application-layer-pattern.md.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]);
