import { Platform } from "react-native";
import Constants from "expo-constants";

export type PushRegistrationResult =
  | { status: "granted"; token: string }
  | { status: "denied" }
  | { status: "unsupported" };

export async function registerForPush(): Promise<PushRegistrationResult> {
  if (Platform.OS === "web") return { status: "unsupported" };
  if (Constants.appOwnership === "expo") return { status: "unsupported" };

  try {
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
