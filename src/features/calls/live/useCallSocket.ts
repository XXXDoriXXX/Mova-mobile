import { useEffect, useRef } from "react";

import { triggerHaptic } from "@/utils/haptics";
import { createCallSocket, onServerEvent, type CallSocket } from "@/realtime/socket";
import type { ClientCommand, ServerEvent } from "@/realtime/protocol";
import { isRecoverable } from "@/realtime/error-codes";

import { useCallStore } from "./callStore";

const PING_INTERVAL_MS = 20_000;

export function useCallSocket(opts: {
  conversationId: string;
  accessToken: string;
  initialStyleId?: string | null;
}) {
  const socketRef = useRef<CallSocket | null>(null);
  const sendRef = useRef<((cmd: ClientCommand) => void) | null>(null);

  useEffect(() => {
    const store = useCallStore.getState();
    store.reset();
    store.setStatus("connecting");

    const socket = createCallSocket({
      token: opts.accessToken,
      conversationId: opts.conversationId,
      lastStreamId: useCallStore.getState().lastStreamId ?? undefined,
    });
    socketRef.current = socket;
    sendRef.current = (cmd: ClientCommand) => socket.sendCommand(cmd);

    socket.on("connect", () => {
      const s = useCallStore.getState();
      if (s.status === "reconnecting") s.setStatus("active");
    });

    socket.io.on("reconnect_attempt", () => {
      const s = useCallStore.getState();
      if (s.status !== "ended") s.setStatus("reconnecting");
      // Refresh handshake auth on every reconnect attempt so the server can
      // replay events since `lastStreamId`. Without this, a reconnect
      // re-sends the original (empty) cursor and drops the gap entirely.
      const lastStreamId = s.lastStreamId ?? undefined;
      socket.auth = {
        token: opts.accessToken,
        conversationId: opts.conversationId,
        lastStreamId,
      };
    });

    socket.on("disconnect", () => {
      const s = useCallStore.getState();
      if (s.status !== "ended") s.setStatus("reconnecting");
    });

    const unsubscribe = onServerEvent(socket, (event) => {
      const s = useCallStore.getState();
      s.setLastStreamId(event.id);
      routeEvent(event);
    });

    const pingTimer = setInterval(() => {
      sendRef.current?.({ type: "ping" });
    }, PING_INTERVAL_MS);

    return () => {
      clearInterval(pingTimer);
      unsubscribe();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      sendRef.current = null;
    };
  }, [opts.conversationId, opts.accessToken]);

  // Apply user-requested style mid-call once connected.
  useEffect(() => {
    const styleId = opts.initialStyleId;
    if (!styleId) return;
    const unsubscribe = useCallStore.subscribe((state, prev) => {
      if (state.status === "active" && prev.status !== "active") {
        sendRef.current?.({
          type: "user.change_style",
          data: { styleId },
        });
      }
    });
    return unsubscribe;
  }, [opts.initialStyleId]);

  return {
    send: (cmd: ClientCommand) => sendRef.current?.(cmd),
  };
}

function routeEvent(event: ServerEvent) {
  const store = useCallStore.getState();
  switch (event.type) {
    case "call.connected":
      store.setStatus("active");
      triggerHaptic("success");
      break;
    case "call.ended":
      store.setEndInfo({
        reason: event.data.reason,
        durationSeconds: event.data.durationSeconds,
        endedBy: event.data.endedBy,
      });
      triggerHaptic("warning");
      break;
    case "transcript.partial":
      store.setInterlocutorPartial(event.data.text);
      break;
    case "transcript.final":
      store.commitInterlocutorFinal(event.data.messageId, event.data.text);
      break;
    case "ai.thinking":
      // Empty payload — presence of the event toggles the indicator. We clear
      // it when the AI's next partial/final arrives (the partial setters do
      // that themselves).
      store.setAiThinking(true);
      break;
    case "ai.text.partial":
      store.setAiPartial(event.data.text);
      break;
    case "ai.text.final":
      store.commitAiFinal(event.data.messageId, event.data.text);
      break;
    case "ai.tts.start":
      // Server-side audio playback over SIP; UI gets the voice for context.
      store.setActiveVoice(event.data.voice);
      break;
    case "ai.tts.end":
      // No UI work here — audio plays on the phone side; final state is on
      // the persisted `Message.ttsStatus`.
      break;
    case "suggestions.new":
      store.setSuggestions(
        event.data.items.map((it) => ({ id: it.id, content: it.text })),
      );
      triggerHaptic("selection");
      break;
    case "usage.tick":
      store.setUsageTick({
        secondsElapsed: event.data.secondsElapsed,
        secondsRemaining: event.data.secondsRemaining,
        planCode: event.data.planCode,
      });
      break;
    case "call.config.changed":
      if (event.data.styleId) store.setActiveStyleId(event.data.styleId);
      if (event.data.voice) store.setActiveVoice(event.data.voice);
      break;
    case "call.error": {
      const err = {
        code: event.data.code,
        message: event.data.message,
        recoverable: event.data.recoverable ?? isRecoverable(event.data.code),
      };
      if (err.recoverable) store.setToastError(err);
      else store.setFatalError(err);
      break;
    }
    case "pong":
      // Heartbeat acked — nothing else to do; useAppStateReconnect watches
      // disconnects directly.
      break;
  }
}
