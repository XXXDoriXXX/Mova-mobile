import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { theme as baseTheme, type Theme } from "./index";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type FontScale,
  type ThemePreferences,
} from "./preferences";

type ThemeContextValue = Theme & { fontScale: FontScale };

type PreferencesContextValue = ThemePreferences & {
  setFontScale: (scale: FontScale) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  ...baseTheme,
  fontScale: 1,
});

const PreferencesContext = createContext<PreferencesContextValue>({
  ...DEFAULT_PREFERENCES,
  setFontScale: () => undefined,
});

/**
 * Single-theme provider. Loads persisted preferences once on mount and
 * persists changes thereafter. There is no dark mode: the design
 * direction is one warm-white scheme, intentionally.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
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

  const setFontScale = useCallback((fontScale: FontScale) => {
    setPrefs((p) => ({ ...p, fontScale }));
  }, []);

  const themeValue = useMemo<ThemeContextValue>(
    () => ({ ...baseTheme, fontScale: prefs.fontScale }),
    [prefs.fontScale],
  );

  const prefsValue = useMemo<PreferencesContextValue>(
    () => ({ ...prefs, setFontScale }),
    [prefs, setFontScale],
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
