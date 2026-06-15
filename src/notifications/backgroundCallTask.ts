import { Platform } from "react-native";
import * as TaskManager from "expo-task-manager";

import { callLog, callWarn } from "@/observability/callLog";

import { loadNotifications } from "./expoNotifications";
import { presentIncomingCall } from "./nativeCallUi";
import { extractTaskCallData, toIncomingCall } from "./incomingCallPayload";

export const BACKGROUND_NOTIFICATION_TASK = "mova-incoming-call";

type TaskBody = { data?: unknown; error?: { message?: string } | null };

// Runs when an incoming-call push arrives while the app is backgrounded or
// killed. With no React tree mounted, this is the only chance to present the
// native call: parse the payload and hand it to callkeep (which sets itself up
// on demand). Foreground pushes are handled by the live socket instead.
export async function handleBackgroundCall(body: TaskBody): Promise<void> {
  if (body.error) {
    callWarn("push.background.error", { message: body.error.message });
    return;
  }
  const call = toIncomingCall(extractTaskCallData(body.data) ?? {});
  if (!call) return;
  callLog("push.background.incoming", { conversationId: call.conversationId });
  await presentIncomingCall(call);
}

// Define the task at module load so the headless JS engine (which boots from
// the app entry on a killed-app push) knows it before the OS invokes it.
function defineBackgroundCallTask(): void {
  if (Platform.OS === "web") return;
  try {
    if (!TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
      TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, (body) =>
        handleBackgroundCall(body as TaskBody),
      );
    }
  } catch (err) {
    callWarn("push.background.defineFailed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

defineBackgroundCallTask();

// Register the (already-defined) task with expo-notifications so OS pushes are
// routed to it. Idempotent; call once at boot.
export async function registerBackgroundCallTask(): Promise<void> {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  } catch (err) {
    callWarn("push.background.registerFailed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
