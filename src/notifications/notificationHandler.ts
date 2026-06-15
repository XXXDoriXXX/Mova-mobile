import { loadNotifications } from "./expoNotifications";

function isIncomingCall(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { type?: unknown }).type === "incoming_call"
  );
}

// A foregrounded incoming-call push must NOT render as a banner: the live
// signaling socket already routes to the in-app incoming screen, and the
// background path presents the native call UI. Showing the banner too would
// double up. Every other notification shows normally.
export function installNotificationHandler(): void {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const call = isIncomingCall(notification.request.content.data);
      return {
        shouldShowBanner: !call,
        shouldShowList: !call,
        shouldPlaySound: !call,
        shouldSetBadge: false,
      };
    },
  });
}
