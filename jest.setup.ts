
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}), {
  virtual: true,
});

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

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "uk" }],
}));

jest.mock("react-native-reanimated", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require("react-native");
  const chainable = () => {
    const obj: Record<string, unknown> = {};
    const fn = () => obj;
    obj.duration = fn;
    obj.delay = fn;
    obj.easing = fn;
    obj.springify = fn;
    obj.damping = fn;
    obj.mass = fn;
    obj.stiffness = fn;
    obj.build = fn;
    return obj;
  };
  const noop = () => ({});
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
    withSequence: (...vs: unknown[]) => vs[vs.length - 1],
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    Easing: {
      inOut: noop,
      in: noop,
      out: noop,
      quad: noop,
      cubic: noop,
      linear: noop,
      ease: noop,
    },
    FadeIn: chainable(),
    FadeOut: chainable(),
    FadeInDown: chainable(),
    FadeOutDown: chainable(),
    SlideInDown: chainable(),
    SlideOutDown: chainable(),
    SlideInRight: chainable(),
    SlideOutLeft: chainable(),
    ZoomIn: chainable(),
    Layout: chainable(),
    LinearTransition: chainable(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initI18n } = require("@/i18n");
initI18n();
