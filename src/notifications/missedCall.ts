import { callWarn } from "@/observability/callLog";

import { loadNotifications } from "./expoNotifications";

// Surface a caller-cancelled ring as a local "missed call" notification, the
// way an ordinary phone does. Fired only when the call was still ringing on our
// side (the caller hung up), never when the user declined it themselves.
export async function postMissedCallNotification(
  callerName: string,
): Promise<void> {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Пропущений дзвінок",
        body: `${callerName} вам телефонував`,
        data: { type: "missed_call" },
      },
      trigger: null,
    });
  } catch (err) {
    callWarn("push.missed.failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
