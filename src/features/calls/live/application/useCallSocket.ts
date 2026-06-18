import { useEffect, useRef } from "react";

import { triggerHaptic } from "@/utils/haptics";
import { createCallSocket, onServerEvent, type CallSocket } from "@/realtime/socket";
import type { ClientCommand, ServerEvent } from "@/realtime/protocol";
import { CallErrorCode } from "@/realtime/error-codes";
import { callLog, callWarn } from "@/observability/callLog";

import { useCallStore, type CallStatus } from "../callStore";
import {
  computeNextCandidate,
  mapAiTextFinalKind,
  resolveCallError,
  shouldAutoPromoteToActive,
} from "./eventMappers";

const PING_INTERVAL_MS = 20_000;

const STREAM_ID_RE = /^\d+-\d+$/;

const HANDSHAKE_TIMEOUT_MS = 25_000;
const ANSWER_TIMEOUT_MS = 60_000;

export function useCallSocket(opts: {
  conversationId: string;
  accessToken: string;
  initialStyleId?: string | null;
}) {
  const socketRef = useRef<CallSocket | null>(null);
  const sendRef = useRef<((cmd: ClientCommand) => void) | null>(null);
  const tokenRef = useRef(opts.accessToken);
  tokenRef.current = opts.accessToken;
  const preReconnectStatusRef = useRef<CallStatus>("connecting");

  useEffect(() => {
    const store = useCallStore.getState();
    store.reset();
    store.setStatus("connecting");
    callLog("call.ws.connecting", { conversationId: opts.conversationId });

    const socket = createCallSocket({
      token: tokenRef.current,
      conversationId: opts.conversationId,
      lastStreamId: useCallStore.getState().lastStreamId ?? undefined,
    });
    socketRef.current = socket;
    sendRef.current = (cmd: ClientCommand) => {
      if (cmd.type !== "ping") {
        callLog("call.ws.command", {
          conversationId: opts.conversationId,
          command: cmd.type,
        });
      }
      socket.sendCommand(cmd);
    };

    socket.on("connect", () => {
      const s = useCallStore.getState();
      s.setWsConnected(true);
      callLog("call.ws.connected", {
        conversationId: opts.conversationId,
        wasReconnecting: s.status === "reconnecting",
      });
      if (s.status === "reconnecting") s.setStatus(preReconnectStatusRef.current);
    });

    socket.io.on("reconnect_attempt", () => {
      const s = useCallStore.getState();
      s.setWsConnected(false);
      if (s.status !== "ended") {
        if (s.status !== "reconnecting") preReconnectStatusRef.current = s.status;
        s.setStatus("reconnecting");
      }
      callWarn("call.ws.reconnectAttempt", {
        conversationId: opts.conversationId,
        lastStreamId: s.lastStreamId ?? null,
      });
      socket.auth = {
        token: tokenRef.current,
        conversationId: opts.conversationId,
        lastStreamId: s.lastStreamId ?? undefined,
      };
    });

    socket.on("disconnect", (reason) => {
      const s = useCallStore.getState();
      s.setWsConnected(false);
      if (s.status !== "ended") {
        if (s.status !== "reconnecting") preReconnectStatusRef.current = s.status;
        s.setStatus("reconnecting");
      }
      callWarn("call.ws.disconnect", {
        conversationId: opts.conversationId,
        reason,
        ended: s.status === "ended",
      });
    });

    socket.on("connect_error", (err: Error) => {
      callWarn("call.ws.connectError", {
        conversationId: opts.conversationId,
        message: err.message,
      });
    });

    const unsubscribe = onServerEvent(socket, (event) => {
      const s = useCallStore.getState();
      if (STREAM_ID_RE.test(event.id)) s.setLastStreamId(event.id);
      callLog("call.ws.event", { conversationId: opts.conversationId, type: event.type });
      routeEvent(event);
    });

    const pingTimer = setInterval(() => {
      sendRef.current?.({ type: "ping" });
    }, PING_INTERVAL_MS);

    const handshakeWatchdog = setTimeout(() => {
      const s = useCallStore.getState();
      if (s.status === "connecting" && !s.fatalError && !s.endInfo) {
        callWarn("call.ws.handshakeTimeout", {
          conversationId: opts.conversationId,
          afterMs: HANDSHAKE_TIMEOUT_MS,
        });
        s.setFatalError({
          code: CallErrorCode.AGENT_LOST,
          message: "CONNECT_TIMEOUT",
          recoverable: false,
        });
        triggerHaptic("error");
      }
    }, HANDSHAKE_TIMEOUT_MS);

    const answerWatchdog = setTimeout(() => {
      const s = useCallStore.getState();
      if (s.status === "ringing" && !s.fatalError && !s.endInfo) {
        callWarn("call.ws.answerTimeout", {
          conversationId: opts.conversationId,
          afterMs: ANSWER_TIMEOUT_MS,
        });
        sendRef.current?.({ type: "user.end_call" });
        s.setFatalError({
          code: CallErrorCode.AGENT_LOST,
          message: "NO_ANSWER",
          recoverable: false,
        });
        triggerHaptic("warning");
      }
    }, ANSWER_TIMEOUT_MS);

    return () => {
      callLog("call.ws.teardown", { conversationId: opts.conversationId });
      clearTimeout(handshakeWatchdog);
      clearTimeout(answerWatchdog);
      clearInterval(pingTimer);
      unsubscribe();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      sendRef.current = null;
    };
  }, [opts.conversationId]);

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

  if (shouldAutoPromoteToActive(store.status, event.type)) {
    store.setStatus("active");
  }

  switch (event.type) {
    case "call.connected":
      if (store.status === "connecting") store.setStatus("ringing");
      break;
    case "call.answered":
      store.setStatus("active");
      triggerHaptic("success");
      break;
    case "call.ended":
      store.setEndInfo({
        reason: event.data.reason,
        durationSeconds: event.data.durationSeconds,
        endedBy: event.data.endedBy,
        errorCode: event.data.errorCode,
        wasAnswered: event.data.wasAnswered,
      });
      triggerHaptic("warning");
      break;
    case "transcript.partial":
      store.setInterlocutorPartial(event.data.text);
      break;
    case "transcript.final":
      store.commitInterlocutorFinal(event.data.messageId, event.data.text);
      break;
    case "transcript.turn_end":
      store.endInterlocutorTurn();
      break;
    case "ai.thinking":
      store.setAiThinking(true);
      store.setPendingAiReply(null);
      break;
    case "ai.text.partial":
      store.setAiPartial(event.data.text);
      break;
    case "ai.text.final": {
      const kind = mapAiTextFinalKind(event.data.source?.provider);
      store.commitAiFinal(event.data.messageId, event.data.text, kind);
      store.setPendingAiReply(null);
      break;
    }
    case "ai.text.candidate": {
      const { next, isNewCandidate } = computeNextCandidate(
        store.pendingAiReply,
        {
          candidateId: event.data.candidateId,
          text: event.data.text,
          autoAcceptInMs: event.data.autoAcceptInMs,
          streaming: event.data.streaming,
        },
        Date.now(),
      );
      store.setPendingAiReply(next);
      if (isNewCandidate) triggerHaptic("light");
      break;
    }
    case "ai.tts.start":
      store.setActiveVoice(event.data.voice);
      break;
    case "ai.tts.end":
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
    case "call.config.changed": {
      if (event.data.styleId) store.setActiveStyleId(event.data.styleId);
      switch (event.data.providerType) {
        case "llm":
          store.setActiveLlm(event.data.provider ?? null, event.data.model ?? null);
          break;
        case "stt":
          store.setActiveStt(event.data.provider ?? null, event.data.model ?? null);
          break;
        case "tts":
          store.setActiveTts(event.data.provider ?? null, event.data.voice ?? null);
          break;
        default:
          if (event.data.voice) store.setActiveVoice(event.data.voice);
      }
      break;
    }
    case "call.error": {
      const err = resolveCallError({
        code: event.data.code,
        message: event.data.message,
        recoverable: event.data.recoverable,
      });
      if (err.recoverable) store.setToastError(err);
      else store.setFatalError(err);
      break;
    }
    case "pong":
      break;
  }
}
