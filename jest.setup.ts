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

// react-native-reanimated has a complex worklet runtime that doesn't run in
// Jest. Roll a minimal mock that covers what the app actually uses:
//  - `default` exports — Animated.View / Animated.Text fall through to RN
//  - useSharedValue / useAnimatedStyle / withRepeat / withTiming / Easing
//  - layout animations (FadeIn / FadeOut) as no-ops with chainable methods
jest.mock("react-native-reanimated", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require("react-native");
  const chainable = () => {
    const obj: Record<string, unknown> = {};
    const fn = () => obj;
    obj.duration = fn;
    obj.delay = fn;
    obj.springify = fn;
    obj.build = fn;
    return obj;
  };
  return {
    __esModule: true,
    default: {
      View: RN.View,
      Text: RN.Text,
      ScrollView: RN.ScrollView,
      createAnimatedComponent: (c: unknown) => c,
    },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    withRepeat: (v: unknown) => v,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    Easing: {
      inOut: () => ({}),
      quad: () => ({}),
      linear: () => ({}),
      ease: () => ({}),
    },
    FadeIn: chainable(),
    FadeOut: chainable(),
    SlideInDown: chainable(),
    SlideOutDown: chainable(),
    Layout: chainable(),
  };
});

// Initialize i18next once for the entire suite so `useTranslation()` works.
// Keeping it here (rather than per-file) means tests that don't care about
// strings still get sensible fallbacks instead of NO_I18NEXT_INSTANCE warnings.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initI18n } = require("@/i18n");
initI18n();
