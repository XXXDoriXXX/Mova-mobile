import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type FontScale = 0.9 | 1 | 1.15 | 1.3;

export type ThemePreferences = {
  fontScale: FontScale;
};

export const DEFAULT_PREFERENCES: ThemePreferences = {
  fontScale: 1,
};

const KEY = "mova.prefs.v2";
const isWeb = Platform.OS === "web";

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
  }
}
