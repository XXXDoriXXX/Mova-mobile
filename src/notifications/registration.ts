import { Platform } from "react-native";
import Constants from "expo-constants";

import { callWarn } from "@/observability/callLog";

function resolveProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

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

    // Standalone/EAS builds require an explicit projectId; without it
    // getExpoPushTokenAsync throws. Pass the resolved id when we have one.
    const projectId = resolveProjectId();
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return { status: "granted", token: token.data };
  } catch (err) {
    // Do NOT swallow silently: a missing projectId / misconfig used to
    // masquerade as a benign "unsupported", so push never worked in prod and
    // nothing was logged. Surface the real cause.
    callWarn("push.register.failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return { status: "unsupported" };
  }
}
