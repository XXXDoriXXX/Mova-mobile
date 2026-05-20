import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * Best-effort push registration. Returns the Expo push token on success.
 *
 * NOTE: The backend has no endpoint to receive the token yet. Once a
 * `POST /v1/users/me/push-tokens` endpoint lands, wire the result here. For
 * now the token lives in-memory only — registration is harmless and we
 * verify the permission + token machinery works end-to-end.
 */
export type PushRegistrationResult =
  | { status: "granted"; token: string }
  | { status: "denied" }
  | { status: "unsupported" };

export async function registerForPush(): Promise<PushRegistrationResult> {
  if (Platform.OS === "web") {
    return { status: "unsupported" };
  }
  try {
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
