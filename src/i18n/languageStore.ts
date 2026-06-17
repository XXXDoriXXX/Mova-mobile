import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import i18n, { type SupportedLocale } from "./index";

const KEY = "mova.language.v1";
const isWeb = Platform.OS === "web";

async function read(): Promise<string | null> {
  if (isWeb) {
    return typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
  }
  return SecureStore.getItemAsync(KEY);
}

async function write(value: string): Promise<void> {
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY, value);
}

type LanguageState = {
  language: SupportedLocale;
  // Apply a saved language override (if any) on startup, so the user's explicit
  // choice survives restarts and beats the device locale.
  hydrate: () => Promise<void>;
  setLanguage: (lng: SupportedLocale) => Promise<void>;
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: (i18n.language as SupportedLocale) ?? "uk",
  async hydrate() {
    try {
      const timeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 2_000),
      );
      const saved = await Promise.race([read(), timeout]);
      if (saved === "uk" || saved === "en") {
        await i18n.changeLanguage(saved);
        set({ language: saved });
      } else {
        set({ language: (i18n.language as SupportedLocale) ?? "uk" });
      }
    } catch {
      set({ language: (i18n.language as SupportedLocale) ?? "uk" });
    }
  },
  async setLanguage(lng) {
    await i18n.changeLanguage(lng);
    set({ language: lng });
    await write(lng).catch(() => undefined);
  },
}));
