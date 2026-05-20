/**
 * Test environment shims. Kept minimal — RN/Expo code that touches native
 * modules is mocked per-test, not globally.
 */

// Suppress noisy "useNativeDriver" warnings during reducer/protocol tests
// that never touch the renderer.
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}), {
  virtual: true,
});

// expo-haptics has no JS fallback in tests; stub the surface we use.
jest.mock("expo-haptics", () => ({
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
  ImpactFeedbackStyle: { Light: "light" },
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
}));

// SecureStore has a native module; stub with an in-memory bag.
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
    setItemAsync: jest.fn((k: string, v: string) => {
      store.set(k, v);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((k: string) => {
      store.delete(k);
      return Promise.resolve();
    }),
  };
});

// expo-constants reads from a manifest we don't have at test time.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: "http://localhost:3000/v1",
        wsUrl: "ws://localhost:3001",
      },
    },
  },
}));

// expo-localization just needs the surface used by `pickInitialLocale`.
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "uk" }],
}));
