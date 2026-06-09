import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY = "mova.onboardingCompleted.v1";
const isWeb = Platform.OS === "web";

async function read(): Promise<string | null> {
  if (isWeb) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(KEY);
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

/** True if the user has already finished onboarding on this device. */
export async function isOnboardingCompleted(): Promise<boolean> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2_000));
  const value = await Promise.race([read(), timeout]);
  return value === "1";
}

export async function markOnboardingCompleted(): Promise<void> {
  await write("1");
}
