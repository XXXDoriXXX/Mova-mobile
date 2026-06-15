import { Platform } from "react-native";

import { registerPushToken } from "@/api/push";
import { registerForPush } from "@/notifications/registration";
import { callWarn } from "@/observability/callLog";

export type EnablePushOutcome = "granted" | "denied" | "unsupported" | "error";

/**
 * Enable push from Settings: request the OS permission AND register the token
 * with the backend. The screen previously only requested permission and toasted
 * success, so the server never got a token — push silently did nothing while the
 * UI claimed it was enabled. "error" means permission was granted but the token
 * could not be persisted (so the UI must not claim success).
 */
export async function enablePushNotifications(): Promise<EnablePushOutcome> {
  const result = await registerForPush();
  if (result.status !== "granted") return result.status;

  try {
    await registerPushToken({
      token: result.token,
      platform: Platform.OS === "android" ? "android" : "ios",
      kind: "data",
    });
    return "granted";
  } catch (err) {
    callWarn("settings.push.registerFailed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return "error";
  }
}
