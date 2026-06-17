import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// A registration/login that is blocked on email confirmation. Persisted so the
// app remembers (across restarts) that the user must verify, and can silently
// log them in once they do — without re-entering credentials. The password is
// kept only in the secure keychain and wiped the moment a session is created.
export type PendingVerification = {
  email: string;
  password: string;
};

const KEY = "mova.pendingVerification.v1";
const isWeb = Platform.OS === "web";

async function read(): Promise<string | null> {
  if (isWeb) {
    return typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
  }
  return SecureStore.getItemAsync(KEY);
}

export async function loadPendingVerification(): Promise<PendingVerification | null> {
  try {
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 2_000),
    );
    const raw = await Promise.race([read(), timeout]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingVerification>;
    if (typeof parsed.email === "string" && typeof parsed.password === "string") {
      return { email: parsed.email, password: parsed.password };
    }
    return null;
  } catch {
    return null;
  }
}

export async function savePendingVerification(
  value: PendingVerification,
): Promise<void> {
  const raw = JSON.stringify(value);
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(KEY, raw);
}

export async function clearPendingVerification(): Promise<void> {
  if (isWeb) {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
