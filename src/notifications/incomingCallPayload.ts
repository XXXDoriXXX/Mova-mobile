import type { IncomingCall } from "@/types/api";

export type IncomingCallData = {
  type?: string;
  conversationId?: string;
  roomName?: string;
  callerId?: string;
  callerName?: string;
};

// The single source of truth for turning a push data payload into a validated
// IncomingCall — shared by the tap listener, the cold-start path and the
// background wake task so they can never drift apart.
export function toIncomingCall(data: IncomingCallData): IncomingCall | null {
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

// Pull the push data object out of an expo-notifications background-task
// payload. A headless (killed-app) delivery carries it as a JSON string under
// `data.dataString`; a tapped NotificationResponse carries it as a nested
// object under `notification.request.content.data`. Tolerate both, plus an
// already-parsed `data` object.
export function extractTaskCallData(payload: unknown): IncomingCallData | null {
  const p = asRecord(payload);
  if (!p) return null;

  const data = asRecord(p.data);
  const dataString = data?.dataString;
  if (typeof dataString === "string") {
    try {
      return JSON.parse(dataString) as IncomingCallData;
    } catch {
      // fall through to the structured shapes
    }
  }

  const notification = asRecord(p.notification);
  const request = asRecord(notification?.request);
  const content = asRecord(request?.content);
  const responseData = asRecord(content?.data);
  if (responseData) return responseData as IncomingCallData;

  if (data && typeof data.type === "string") return data as IncomingCallData;
  return null;
}
