import { useEffect } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import type { Socket } from "socket.io-client";

import { useAuthStore } from "@/auth/store";
import { createSignalSocket, onSignalEvent } from "@/realtime/signal";
import { registerForPush } from "@/notifications/registration";
import { addIncomingCallListener } from "@/notifications/incomingCallListener";
import { registerPushToken } from "@/api/push";

import { useCallSignalStore } from "../callSignalStore";
import {
  dismissNativeCall,
  presentIncomingCall,
  setupNativeCallUi,
} from "./nativeCallUi";

async function syncPushToken(): Promise<void> {
  try {
    const result = await registerForPush();
    if (result.status === "granted") {
      await registerPushToken({
        token: result.token,
        platform: Platform.OS === "android" ? "android" : "ios",
        kind: "data",
      });
    }
  } catch {
    // best-effort
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
        useCallSignalStore.getState().clearForConversation(conversationId);
      },
    });

    const socket: Socket = createSignalSocket({ token: accessToken });
    const store = useCallSignalStore.getState();

    const off = onSignalEvent(socket, (event) => {
      switch (event.type) {
        case "call.incoming":
          store.setIncoming(event.data);
          presentIncomingCall(event.data);
          router.push({
            pathname: "/call/incoming",
            params: { conversationId: event.data.conversationId },
          });
          return;
        case "call.cancelled":
          dismissNativeCall(event.data.conversationId);
          store.clearForConversation(event.data.conversationId);
          return;
        case "call.accepted":
          store.setOutgoingStatus("accepted");
          return;
        case "call.declined":
          store.setOutgoingStatus("declined");
          return;
      }
    });

    const offPush = addIncomingCallListener((call) => {
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
