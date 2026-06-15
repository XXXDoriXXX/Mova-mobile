import { Platform } from "react-native";

import type { IncomingCall } from "@/types/api";

export type NativeCallHandlers = {
  onAnswer: (conversationId: string) => void;
  onEnd: (conversationId: string) => void;
};

type CallKeepLike = {
  setup: (options: unknown) => Promise<void>;
  setAvailable?: (available: boolean) => void;
  setReachable?: () => void;
  registerPhoneAccount?: (options: unknown) => void;
  displayIncomingCall: (
    uuid: string,
    handle: string,
    name: string,
    handleType?: string,
    hasVideo?: boolean,
  ) => void;
  endCall: (uuid: string) => void;
  endAllCalls?: () => void;
  reportEndCallWithUUID?: (uuid: string, reason: number) => void;
  addEventListener: (event: string, cb: (payload: unknown) => void) => void;
  removeEventListener: (event: string) => void;
  backToForeground?: () => void;
};

function loadCallKeep(): CallKeepLike | null {
  try {
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
let setupPromise: Promise<void> | null = null;

export function isNativeCallUiAvailable(): boolean {
  return callKeep !== null;
}

// Set/replace the handlers the native call UI dispatches to. The actual
// callkeep setup happens once (ensureSetup) regardless of how many times the
// app mounts — re-running setup would re-register duplicate listeners.
export function setNativeCallHandlers(next: NativeCallHandlers): void {
  handlers = next;
}

function dispatchEvent(event: string, payload: unknown): void {
  const id = (payload as { callUUID?: string }).callUUID;
  if (!id) return;
  if (event === "answerCall") {
    handlers?.onAnswer(id);
    callKeep?.backToForeground?.();
  } else if (event === "endCall") {
    handlers?.onEnd(id);
  }
}

function ensureSetup(): Promise<void> {
  if (!callKeep) return Promise.resolve();
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    await callKeep.setup({
      ios: { appName: "Mova", supportsVideo: false },
      android: {
        // Self-managed: callkeep owns the full-screen incoming UI and routes
        // answer/decline back to JS, instead of handing the call to the system
        // dialer (which needs a Telecom phone account + READ_CALL_LOG).
        selfManaged: true,
        alertTitle: "Дозволи",
        alertDescription: "Mova потребує доступу для дзвінків",
        cancelButton: "Скасувати",
        okButton: "Гаразд",
        additionalPermissions: [],
        foregroundService: {
          channelId: "com.mova.calls",
          channelName: "Активний дзвінок Mova",
          notificationTitle: "Mova активна",
        },
      },
    });
    if (Platform.OS === "android") {
      callKeep.registerPhoneAccount?.({});
      callKeep.setAvailable?.(true);
    }
    callKeep.setReachable?.();

    callKeep.addEventListener("answerCall", (p) => dispatchEvent("answerCall", p));
    callKeep.addEventListener("endCall", (p) => dispatchEvent("endCall", p));
    // Killed-state answer: an answer/decline tapped on the lockscreen before
    // the JS engine finished booting is buffered by callkeep and replayed here
    // once a listener attaches — without this, that first action is lost.
    callKeep.addEventListener("didLoadWithEvents", (p) => {
      const events = (p as { name: string; data: unknown }[]) ?? [];
      for (const e of events) {
        if (e?.name === "RNCallKeepPerformAnswerCallAction") {
          dispatchEvent("answerCall", e.data);
        } else if (e?.name === "RNCallKeepPerformEndCallAction") {
          dispatchEvent("endCall", e.data);
        }
      }
    });
  })();
  return setupPromise;
}

// Called from the UI layer (useCallSignaling) with the real router/teardown
// handlers. Idempotent: handlers are swapped in place; callkeep is set up once.
export async function setupNativeCallUi(
  next: NativeCallHandlers,
): Promise<void> {
  setNativeCallHandlers(next);
  await ensureSetup();
}

// Present the native incoming-call screen. Awaits setup first because the
// background push task runs with no React tree mounted, so setupNativeCallUi
// has not necessarily run yet.
export async function presentIncomingCall(call: IncomingCall): Promise<void> {
  if (!callKeep) return;
  await ensureSetup();
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
