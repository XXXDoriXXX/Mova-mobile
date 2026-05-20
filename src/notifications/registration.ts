import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Best-effort push registration.
 *
 * The backend has no `/users/me/push-tokens` endpoint yet, so we just verify
 * the permission + token machinery end-to-end and keep the result in memory.
 *
 * Implementation notes:
 *  - Web has no push surface.
 *  - **Expo Go (SDK 53+) dropped support for remote push tokens entirely**;
 *    even *importing* `expo-notifications` triggers a `.fx.js` side-effect
 *    file that calls `addPushTokenListener`, which throws
 *    "removed from Expo Go" → red-box on first render of Settings.
 *  - We `require()` the module lazily (inside this function) so the
 *    offending side-effect chain only loads in dev clients / standalone
 *    builds, and we short-circuit Expo Go via `appOwnership` BEFORE the
 *    require even fires.
 */
export type PushRegistrationResult =
  | { status: "granted"; token: string }
  | { status: "denied" }
  | { status: "unsupported" };

export async function registerForPush(): Promise<PushRegistrationResult> {
  if (Platform.OS === "web") return { status: "unsupported" };
  // appOwnership === "expo" → running inside Expo Go; "standalone" / "guest"
  // → a real build or development client.
  if (Constants.appOwnership === "expo") return { status: "unsupported" };

  try {
    // Lazy require so the side-effect chain inside
    // `expo-notifications/build/DevicePushTokenAutoRegistration.fx.js`
    // never loads in environments that can't handle it.
    const Notifications =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("expo-notifications") as typeof import("expo-notifications");

    const settings = await Notifications.getPermissionsAsync();
    let granted =
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted =
        req.granted ||
        req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }

    if (!granted) return { status: "denied" };

    const token = await Notifications.getExpoPushTokenAsync();
    return { status: "granted", token: token.data };
  } catch {
    return { status: "unsupported" };
  }
}
