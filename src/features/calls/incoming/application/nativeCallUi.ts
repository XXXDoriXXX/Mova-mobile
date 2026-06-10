import { Platform } from "react-native";

import type { IncomingCall } from "@/types/api";

export type NativeCallHandlers = {
  onAnswer: (conversationId: string) => void;
  onEnd: (conversationId: string) => void;
};

type CallKeepLike = {
  setup: (options: unknown) => Promise<void>;
  registerPhoneAccount?: (options: unknown) => void;
  displayIncomingCall: (
    uuid: string,
    handle: string,
    name: string,
    handleType?: string,
    hasVideo?: boolean,
  ) => void;
  endCall: (uuid: string) => void;
  reportEndCallWithUUID?: (uuid: string, reason: number) => void;
  addEventListener: (event: string, cb: (payload: unknown) => void) => void;
  removeEventListener: (event: string) => void;
  backToForeground?: () => void;
};

function loadCallKeep(): CallKeepLike | null {
  try {
    // Optional native dependency. Present only in a custom dev/standalone
    // build (`npx expo install react-native-callkeep`). Absent in Expo Go,
    // where the hook falls back to an in-app incoming-call screen.

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-callkeep") as {
      default?: CallKeepLike;
    } & CallKeepLike;
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

const callKeep = loadCallKeep();

let handlers: NativeCallHandlers | null = null;
let initialized = false;

export function isNativeCallUiAvailable(): boolean {
  return callKeep !== null;
}

export async function setupNativeCallUi(
  next: NativeCallHandlers,
): Promise<void> {
  handlers = next;
  if (!callKeep || initialized) return;
  initialized = true;
  await callKeep.setup({
    ios: { appName: "Mova" },
    android: {
      alertTitle: "Дозволи",
      alertDescription: "Mova потребує доступу для дзвінків",
      cancelButton: "Скасувати",
      okButton: "Гаразд",
      foregroundService: {
        channelId: "com.mova.calls",
        channelName: "Вхідні дзвінки",
        notificationTitle: "Mova активна",
      },
    },
  });
  callKeep.addEventListener("answerCall", (payload) => {
    const id = (payload as { callUUID?: string }).callUUID;
    if (id) handlers?.onAnswer(id);
    callKeep.backToForeground?.();
  });
  callKeep.addEventListener("endCall", (payload) => {
    const id = (payload as { callUUID?: string }).callUUID;
    if (id) handlers?.onEnd(id);
  });
}

export function presentIncomingCall(call: IncomingCall): void {
  if (!callKeep) return;
  callKeep.displayIncomingCall(
    call.conversationId,
    call.caller.id,
    call.caller.name,
    "generic",
    false,
  );
}

export function dismissNativeCall(conversationId: string): void {
  if (!callKeep) return;
  if (Platform.OS === "ios" && callKeep.reportEndCallWithUUID) {
    callKeep.reportEndCallWithUUID(conversationId, 2);
  }
  callKeep.endCall(conversationId);
}
