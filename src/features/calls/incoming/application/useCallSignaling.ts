import { useEffect } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import type { Socket } from "socket.io-client";

import { useAuthStore } from "@/auth/store";
import { createSignalSocket, onSignalEvent } from "@/realtime/signal";
import { registerForPush } from "@/notifications/registration";
import { addIncomingCallListener } from "@/notifications/incomingCallListener";
import { postMissedCallNotification } from "@/notifications/missedCall";
import { registerPushToken } from "@/api/push";
import { declinePeerCall } from "@/api/calls";
import { callLog, callWarn } from "@/observability/callLog";

import {
  dismissNativeCall,
  presentIncomingCall,
  setupNativeCallUi,
} from "@/notifications/nativeCallUi";

import { useCallSignalStore } from "../callSignalStore";

async function syncPushToken(): Promise<void> {
  try {
    const result = await registerForPush();
    callLog("signal.push.register", { status: result.status });
    if (result.status === "granted") {
      await registerPushToken({
        token: result.token,
        platform: Platform.OS === "android" ? "android" : "ios",
        kind: "data",
      });
      callLog("signal.push.tokenSynced");
    }
  } catch (err) {
    callWarn("signal.push.syncFailed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export function useCallSignaling(): void {
  const status = useAuthStore((s) => s.status);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (status !== "authed" || !accessToken) return;

    void syncPushToken();
    void setupNativeCallUi({
      onAnswer: (conversationId) => {
        router.push({
          pathname: "/call/incoming",
          params: { conversationId, autoAnswer: "1" },
        });
      },
      onEnd: (conversationId) => {
        // The native (CallKit/CallKeep) decline is the most common reject path
        // on a locked phone. Notify the backend (teardown + signal the caller)
        // — not just clear local state — or the caller stays stuck "ringing"
        // and the callee's PENDING row blocks them for ~5 min. Fire-and-forget.
        void declinePeerCall(conversationId).catch((err) =>
          callWarn("signal.nativeDecline.failed", {
            message: err instanceof Error ? err.message : String(err),
          }),
        );
        useCallSignalStore.getState().clearForConversation(conversationId);
      },
    });

    const socket: Socket = createSignalSocket({ token: accessToken });
    const store = useCallSignalStore.getState();
    callLog("signal.connecting");
    socket.on("connect", () => callLog("signal.connected"));
    socket.on("disconnect", (reason) => callWarn("signal.disconnect", { reason }));
    socket.on("connect_error", (err: Error) =>
      callWarn("signal.connectError", { message: err.message }),
    );

    const off = onSignalEvent(socket, (event) => {
      callLog("signal.event", {
        type: event.type,
        conversationId: event.data.conversationId,
      });
      switch (event.type) {
        case "call.incoming":
          store.setIncoming(event.data);
          void presentIncomingCall(event.data);
          router.push({
            pathname: "/call/incoming",
            params: { conversationId: event.data.conversationId },
          });
          return;
        case "call.cancelled": {
          // Read fresh state: a still-present `incoming` means the caller hung
          // up while it was ringing (a genuine missed call). A user-initiated
          // decline clears the store synchronously first, so this is null then.
          const ringing = useCallSignalStore.getState().incoming;
          const missed =
            ringing?.conversationId === event.data.conversationId
              ? ringing.caller.name
              : null;
          dismissNativeCall(event.data.conversationId);
          store.clearForConversation(event.data.conversationId);
          if (missed) void postMissedCallNotification(missed);
          return;
        }
        case "call.accepted":
          store.setOutgoingStatus("accepted");
          return;
        case "call.declined":
          store.setOutgoingStatus("declined");
          return;
      }
    });

    const offPush = addIncomingCallListener((call) => {
      callLog("signal.push.tapped", { conversationId: call.conversationId });
      store.setIncoming(call);
      router.push({
        pathname: "/call/incoming",
        params: { conversationId: call.conversationId },
      });
    });

    return () => {
      off();
      offPush();
      socket.disconnect();
    };
  }, [status, accessToken]);
}
