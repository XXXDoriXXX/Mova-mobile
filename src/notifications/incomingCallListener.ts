import { Platform } from "react-native";
import Constants from "expo-constants";

import type { IncomingCall } from "@/types/api";

type IncomingCallData = {
  type?: string;
  conversationId?: string;
  roomName?: string;
  callerId?: string;
  callerName?: string;
};

function toIncomingCall(data: IncomingCallData): IncomingCall | null {
  if (
    data.type !== "incoming_call" ||
    !data.conversationId ||
    !data.roomName ||
    !data.callerId
  ) {
    return null;
  }
  return {
    conversationId: data.conversationId,
    roomName: data.roomName,
    caller: { id: data.callerId, name: data.callerName ?? "Невідомий" },
  };
}

// Identifier of the launch notification already handled via the cold-start
// path, so the live listener and effect re-runs don't re-open the same call.
let handledColdStartId: string | null = null;

export function addIncomingCallListener(
  onIncoming: (call: IncomingCall) => void,
): () => void {
  if (Platform.OS === "web" || Constants.appOwnership === "expo") {
    return () => undefined;
  }
  try {
    const Notifications =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("expo-notifications") as typeof import("expo-notifications");

    // Cold start: a call notification tapped while the app was KILLED launches
    // the app but is never delivered to the live listener below (registered too
    // late). getLastNotificationResponseAsync returns that launch response.
    void Notifications.getLastNotificationResponseAsync()
      .then((resp) => {
        if (!resp) return;
        const id = resp.notification.request.identifier;
        if (id === handledColdStartId) return;
        const call = toIncomingCall(
          (resp.notification.request.content.data ?? {}) as IncomingCallData,
        );
        if (call) {
          handledColdStartId = id;
          onIncoming(call);
        }
      })
      .catch(() => undefined);

    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      if (resp.notification.request.identifier === handledColdStartId) return;
      const call = toIncomingCall(
        (resp.notification.request.content.data ?? {}) as IncomingCallData,
      );
      if (call) onIncoming(call);
    });
    return () => sub.remove();
  } catch {
    return () => undefined;
  }
}
