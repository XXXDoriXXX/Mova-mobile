import { useEffect, useRef } from "react";

import { triggerHaptic } from "@/utils/haptics";
import { createCallSocket, onServerEvent, type CallSocket } from "@/realtime/socket";
import type { ClientCommand, ServerEvent } from "@/realtime/protocol";
import { CallErrorCode } from "@/realtime/error-codes";

import { useCallStore } from "../callStore";
import {
  computeNextCandidate,
  mapAiTextFinalKind,
  resolveCallError,
  shouldAutoPromoteToActive,
} from "./eventMappers";

const PING_INTERVAL_MS = 20_000;

/**
 * Two-stage watchdog windows for the loader screen:
 *
 *   - HANDSHAKE_TIMEOUT_MS — no `call.connected` within this window means
 *     the backend chain is dead (worker crashed, livekit SIP couldn't
 *     dial, agent never joined the room). Fatal-out so the user can
 *     retry instead of staring at a "connecting" spinner forever.
 *
 *   - ANSWER_TIMEOUT_MS — `call.connected` arrived but `call.answered`
 *     never did, i.e. the phone is ringing and ringing. Real PSTN call
 *     timeouts are 30–60s (after which voicemail or carrier drops it),
 *     so we give 60s here and only then fatal with NO_ANSWER copy.
 */
const HANDSHAKE_TIMEOUT_MS = 25_000;
const ANSWER_TIMEOUT_MS = 60_000;

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
      s.setWsConnected(true);
      if (s.status === "reconnecting") s.setStatus("active");
    });

    socket.io.on("reconnect_attempt", () => {
      const s = useCallStore.getState();
      s.setWsConnected(false);
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
      s.setWsConnected(false);
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

    // Handshake watchdog — fatal if we never made it past `connecting`.
    const handshakeWatchdog = setTimeout(() => {
      const s = useCallStore.getState();
      if (s.status === "connecting" && !s.fatalError && !s.endInfo) {
        s.setFatalError({
          code: CallErrorCode.AGENT_LOST,
          message: "CONNECT_TIMEOUT",
          recoverable: false,
        });
        triggerHaptic("error");
      }
    }, HANDSHAKE_TIMEOUT_MS);

    // Answer watchdog — backend dialed fine but nobody picked up. We
    // wait a full minute to cover the typical PSTN ring window before
    // ending the call locally with a `NO_ANSWER` reason; sending
    // `user.end_call` ensures the trunk leg is hung up too.
    const answerWatchdog = setTimeout(() => {
      const s = useCallStore.getState();
      if (s.status === "ringing" && !s.fatalError && !s.endInfo) {
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
      clearTimeout(handshakeWatchdog);
      clearTimeout(answerWatchdog);
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

  if (shouldAutoPromoteToActive(store.status, event.type)) {
    store.setStatus("active");
  }

  switch (event.type) {
    case "call.connected":
      // Agent + WS are ready. The phone hasn't picked up yet — stay in
      // the ringing state and let `call.answered` (or any real signal
      // above) advance us to `active`.
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
      // that themselves). Also drop any previous candidate card: ai.thinking
      // signals the AI is restarting work for a new turn, so the old preview
      // is stale and would otherwise linger until the new candidate replaces it.
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
    case "call.config.changed": {
      // styleId rides on the LLM event (resolved server-side from
      // template / preference). Apply unconditionally — it's the only
      // surface where mid-call style change reaches us.
      if (event.data.styleId) store.setActiveStyleId(event.data.styleId);
      // Provider snapshots are typed via `providerType`. Apply each to
      // its own slot so the in-call info strip can render the full
      // active stack ("Deepgram · GPT-4o · ElevenLabs (Rachel)") instead
      // of just the voice the user happened to switch last.
      switch (event.data.providerType) {
        case "llm":
          store.setActiveLlm(
            event.data.provider ?? null,
            event.data.model ?? null,
          );
          break;
        case "stt":
          store.setActiveStt(
            event.data.provider ?? null,
            event.data.model ?? null,
          );
          break;
        case "tts":
          store.setActiveTts(
            event.data.provider ?? null,
            event.data.voice ?? null,
          );
          break;
        default:
          // Legacy / untyped change events (e.g. user.change_voice from
          // an older agent build) — fall back to voice-only.
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
      // Heartbeat acked — nothing else to do; useAppStateReconnect watches
      // disconnects directly.
      break;
  }
}
