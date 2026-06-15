import { Platform } from "react-native";

import { callWarn } from "@/observability/callLog";

import { loadNotifications } from "./expoNotifications";

// Must match the channelId the backend stamps on the incoming-call push
// (apps/api-gateway push-notifier). A push to a channel the app never created
// silently falls back to the default channel: no heads-up, no full-screen, no
// call sound — so the call notification looks like an ordinary message.
export const INCOMING_CALL_CHANNEL_ID = "incoming-calls";

// IMPORTANCE.MAX is what earns a heads-up + full-screen-intent presentation and
// lets the call ring through Do-Not-Disturb, like a real phone call.
export async function ensureIncomingCallChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  const Notifications = loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.setNotificationChannelAsync(INCOMING_CALL_CHANNEL_ID, {
      name: "Вхідні дзвінки",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 600, 400, 600],
      enableVibrate: true,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: false,
    });
  } catch (err) {
    callWarn("push.channel.failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
