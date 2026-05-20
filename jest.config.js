/**
 * Jest config for the Expo / React Native app.
 *
 * Tests live in __tests__ at the repo root and consume the `@/` alias via
 * `moduleNameMapper`. The preset handles the bulk of RN/Expo transformations;
 * `transformIgnorePatterns` is widened so packages shipped as ESM are
 * transformed instead of being executed verbatim.
 */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.ts",
    "@testing-library/jest-native/extend-expect",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.(ts|tsx)"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|expo(nent)?|@expo|@expo/.*|expo-modules-core|expo-haptics|expo-secure-store|expo-localization|expo-router|expo-constants|expo-notifications|expo-linking|expo-splash-screen|expo-font|expo-status-bar|expo-system-ui|expo-image|expo-web-browser|expo-symbols|unimodules|sentry-expo|native-base|react-native-svg|@react-native-community|socket\\.io-client|@tanstack/react-query|i18next|react-i18next|nanoid|zustand|axios)/)",
  ],
  testEnvironment: "node",
};
