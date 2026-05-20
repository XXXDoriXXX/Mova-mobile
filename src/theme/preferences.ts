import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/** Light/dark override; `system` follows OS via `useColorScheme()`. */
export type ThemeMode = "system" | "light" | "dark";

/** Discrete font-scale multipliers applied on top of typography variant sizes. */
export type FontScale = 0.9 | 1 | 1.15 | 1.3;

export type ThemePreferences = {
  mode: ThemeMode;
  fontScale: FontScale;
};

export const DEFAULT_PREFERENCES: ThemePreferences = {
  mode: "system",
  fontScale: 1,
};

const KEY = "mova.prefs.v1";
const isWeb = Platform.OS === "web";

function isMode(v: unknown): v is ThemeMode {
  return v === "system" || v === "light" || v === "dark";
}

function isScale(v: unknown): v is FontScale {
  return v === 0.9 || v === 1 || v === 1.15 || v === 1.3;
}

async function rawGet(): Promise<string | null> {
  if (isWeb) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(KEY);
  }
  return SecureStore.getItemAsync(KEY);
}

async function rawSet(value: string): Promise<void> {
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY, value);
}

export async function loadPreferences(): Promise<ThemePreferences> {
  try {
    const raw = await rawGet();
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<ThemePreferences>;
    return {
      mode: isMode(parsed.mode) ? parsed.mode : DEFAULT_PREFERENCES.mode,
      fontScale: isScale(parsed.fontScale)
        ? parsed.fontScale
        : DEFAULT_PREFERENCES.fontScale,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: ThemePreferences): Promise<void> {
  try {
    await rawSet(JSON.stringify(prefs));
  } catch {
    // Persistence failures are silent — settings still apply for the session.
  }
}
