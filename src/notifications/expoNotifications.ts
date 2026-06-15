import { Platform } from "react-native";

export type ExpoNotifications = typeof import("expo-notifications");

// expo-notifications has no web implementation and is absent from the web
// bundle, so resolve it lazily behind a guard instead of a static import.
// Native modules are always present in a dev/EAS build; the try/catch only
// guards the web bundle and any stripped runtime.
export function loadNotifications(): ExpoNotifications | null {
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-notifications") as ExpoNotifications;
  } catch {
    return null;
  }
}
