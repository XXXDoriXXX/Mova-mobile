import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import type { AuthTokens } from "@/types/api";

const ACCESS_KEY = "mova.accessToken";
const REFRESH_KEY = "mova.refreshToken";

// Platform-aware storage:
// - native (iOS / Android) → expo-secure-store (Keychain / EncryptedSharedPrefs)
// - web → localStorage. NOTE: web storage is NOT secure; web is dev-only.
const isWeb = Platform.OS === "web";

function webStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return webStorage()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    webStorage()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    webStorage()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    getItem(ACCESS_KEY),
    getItem(REFRESH_KEY),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    setItem(ACCESS_KEY, tokens.accessToken),
    setItem(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([removeItem(ACCESS_KEY), removeItem(REFRESH_KEY)]);
}
