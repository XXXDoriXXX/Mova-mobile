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
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
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
