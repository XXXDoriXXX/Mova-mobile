import { useEffect, useRef } from "react";

import { createCallSocket, type CallSocket } from "@/realtime/socket";
import type { ClientCommand } from "@/realtime/commands";
import type { ServerEvent } from "@/realtime/events";
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
    });
    socketRef.current = socket;
    sendRef.current = (cmd: ClientCommand) => socket.sendCommand(cmd);

    socket.on("connect", () => {
      const s = useCallStore.getState();
      if (s.status === "reconnecting") s.setStatus("active");
    });

    socket.io.on("reconnect_attempt", () => {
      useCallStore.getState().setStatus("reconnecting");
    });

    socket.on("disconnect", () => {
      const s = useCallStore.getState();
      if (s.status !== "ended") s.setStatus("reconnecting");
    });

    socket.on("event", (event: ServerEvent) => {
      const s = useCallStore.getState();
      s.setLastStreamId(event.id);
      routeEvent(event);
    });

    const pingTimer = setInterval(() => {
      sendRef.current?.({ type: "ping", data: { sentAt: Date.now() } });
    }, PING_INTERVAL_MS);

    return () => {
      clearInterval(pingTimer);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      sendRef.current = null;
    };
  }, [opts.conversationId, opts.accessToken]);

  // Apply user-requested style mid-call once connected.
  useEffect(() => {
    if (!opts.initialStyleId) return;
    const unsubscribe = useCallStore.subscribe((state, prev) => {
      if (state.status === "active" && prev.status !== "active") {
        sendRef.current?.({
          type: "user.change_style",
          data: { styleId: opts.initialStyleId as string },
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
      break;
    case "call.ended":
      store.setEndInfo({
        endReason: event.data.endReason,
        durationSeconds: event.data.durationSeconds,
      });
      break;
    case "transcript.partial":
      store.setInterlocutorPartial(event.data.content);
      break;
    case "transcript.final":
      store.commitInterlocutorFinal(event.data.messageId, event.data.content);
      break;
    case "ai.thinking":
      store.setAiThinking(event.data.active);
      break;
    case "ai.text.partial":
      store.setAiPartial(event.data.content);
      break;
    case "ai.text.final":
      store.commitAiFinal(event.data.messageId, event.data.content);
      break;
    case "ai.tts.start":
    case "ai.tts.end":
      // Audio playback is handled server-side over SIP; no UI work needed.
      break;
    case "suggestions.new":
      store.setSuggestions(event.data.items);
      break;
    case "usage.tick":
      store.setUsageTick(event.data);
      break;
    case "call.config.changed":
      if (event.data.styleId) store.setActiveStyleId(event.data.styleId);
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
  }
}
