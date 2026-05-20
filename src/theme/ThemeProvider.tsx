import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { darkTheme, lightTheme, type Theme } from "./index";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type FontScale,
  type ThemeMode,
  type ThemePreferences,
} from "./preferences";

type ThemeContextValue = Theme & { fontScale: FontScale };

type PreferencesContextValue = ThemePreferences & {
  setMode: (mode: ThemeMode) => void;
  setFontScale: (scale: FontScale) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  ...lightTheme,
  fontScale: 1,
});

const PreferencesContext = createContext<PreferencesContextValue>({
  ...DEFAULT_PREFERENCES,
  setMode: () => undefined,
  setFontScale: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const osScheme = useColorScheme();
  const [prefs, setPrefs] = useState<ThemePreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPreferences().then((loaded) => {
      if (!cancelled) {
        setPrefs(loaded);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void savePreferences(prefs);
  }, [prefs, hydrated]);

  const setMode = useCallback((mode: ThemeMode) => {
    setPrefs((p) => ({ ...p, mode }));
  }, []);

  const setFontScale = useCallback((fontScale: FontScale) => {
    setPrefs((p) => ({ ...p, fontScale }));
  }, []);

  const effectiveScheme = useMemo<"light" | "dark">(() => {
    if (prefs.mode === "light") return "light";
    if (prefs.mode === "dark") return "dark";
    return osScheme === "dark" ? "dark" : "light";
  }, [prefs.mode, osScheme]);

  const themeValue = useMemo<ThemeContextValue>(
    () => ({
      ...(effectiveScheme === "dark" ? darkTheme : lightTheme),
      fontScale: prefs.fontScale,
    }),
    [effectiveScheme, prefs.fontScale],
  );

  const prefsValue = useMemo<PreferencesContextValue>(
    () => ({ ...prefs, setMode, setFontScale }),
    [prefs, setMode, setFontScale],
  );

  return (
    <PreferencesContext.Provider value={prefsValue}>
      <ThemeContext.Provider value={themeValue}>
        {children}
      </ThemeContext.Provider>
    </PreferencesContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function useThemePreferences(): PreferencesContextValue {
  return useContext(PreferencesContext);
}
