import { create } from "zustand";

import type { CallErrorCode } from "@/realtime/error-codes";

export type CallStatus =
  | "idle"
  | "connecting"
  | "ringing"
  | "active"
  | "reconnecting"
  | "ended";

export type Bubble = {
  id: string;
  role: "interlocutor" | "ai" | "user" | "system";
  content: string;
  partial: boolean;
  ts: number;
  /** AI bubbles only. Distinguishes "real LLM reply" from synthetic
   *  ones the agent speaks when the LLM stalls or the interlocutor
   *  goes quiet. Drives a different bubble style + label so the user
   *  doesn't mistake "Алло? Ви чуєте?" for a real question to answer. */
  kind?: "normal" | "fallback" | "idle_probe";
};

export type CallSuggestion = {
  id: string;
  content: string;
};

/**
 * In-flight AI reply candidate awaiting user decision. Backend emits
 * one of these on ai.text.candidate; mobile shows it as a preview
 * card with a countdown ring (when autoAcceptInMs is non-null) and
 * Send / Cancel actions. Replaced on every new candidate, cleared on
 * accept/cancel/timeout.
 */
export type PendingAiReply = {
  candidateId: string;
  text: string;
  /** ms until auto-accept; null in manual mode (no timer). */
  autoAcceptInMs: number | null;
  /** Wall-clock ms when we received this candidate — drives the
   *  countdown ring locally without depending on a server tick. */
  receivedAt: number;
};

export type CallError = {
  code: CallErrorCode;
  message: string;
  recoverable: boolean;
};

export type CallEnd = {
  /** Matches backend `call.ended` data.reason. */
  reason: "user" | "interlocutor" | "balance" | "fatal_error" | "timeout" | "admin";
  durationSeconds: number;
  endedBy: "user" | "system" | "interlocutor" | "admin";
};

export type UsageTick = {
  /** Seconds elapsed since the call started. */
  secondsElapsed: number;
  /** null for paid plans (no free quota left to count down). */
  secondsRemaining: number | null;
  planCode: "free" | "paid";
};

type CallState = {
  status: CallStatus;
  /** Whether the WebSocket transport itself is currently connected.
   *  Distinct from `status` (which tracks the call lifecycle): we can
   *  have `wsConnected: true` while still in `status: "connecting"`
   *  because the call is waiting on backend dial + livekit handshake. */
  wsConnected: boolean;
  /** ms-since-epoch when the screen first started the connect flow.
   *  Used by the live screen to compute the "phase" copy
   *  ("ringing", "still ringing…") and to gate the connect-timeout. */
  connectStartedAt: number | null;
  bubbles: Bubble[];
  suggestions: CallSuggestion[];
  aiThinking: boolean;
  usageTick: UsageTick | null;
  /** Current AI candidate awaiting user accept/cancel. Drives the
   *  "about to speak" preview card. Null when no candidate pending. */
  pendingAiReply: PendingAiReply | null;
  /** Per-call "auto-accept candidates after timer" toggle. Defaults
   *  to true to preserve the conversational pace of the previous
   *  always-auto behaviour. Settings drawer toggles it; flip syncs
   *  to backend via user.set_auto_mode WS command. */
  autoMode: boolean;
  activeStyleId: string | null;
  activeVoice: string | null;
  activeLlmProvider: string | null;
  activeLlmModel: string | null;
  activeSttProvider: string | null;
  activeSttModel: string | null;
  activeTtsProvider: string | null;
  lastStreamId: string | null;
  toastError: CallError | null;
  fatalError: CallError | null;
  endInfo: CallEnd | null;

  reset: () => void;
  setStatus: (status: CallStatus) => void;
  setWsConnected: (connected: boolean) => void;
  setPendingAiReply: (reply: PendingAiReply | null) => void;
  setAutoMode: (enabled: boolean) => void;
  setActiveStyleId: (styleId: string | null) => void;
  setActiveVoice: (voice: string | null) => void;
  setActiveLlm: (provider: string | null, model: string | null) => void;
  setActiveStt: (provider: string | null, model: string | null) => void;
  setActiveTts: (provider: string | null, voice: string | null) => void;
  setLastStreamId: (id: string | null) => void;

  setInterlocutorPartial: (text: string) => void;
  commitInterlocutorFinal: (messageId: string, text: string) => void;

  setAiPartial: (text: string) => void;
  commitAiFinal: (messageId: string, text: string, kind?: Bubble["kind"]) => void;
  setAiThinking: (active: boolean) => void;

  pushUserTyped: (content: string) => void;
  pushSystem: (content: string) => void;

  setSuggestions: (items: CallSuggestion[]) => void;
  removeSuggestion: (id: string) => void;

  setUsageTick: (tick: UsageTick) => void;

  setToastError: (err: CallError | null) => void;
  setFatalError: (err: CallError | null) => void;

  setEndInfo: (info: CallEnd) => void;
};

let bubbleCounter = 0;
const nextLocalId = () => `local-${++bubbleCounter}`;

const PARTIAL_INTERLOCUTOR_ID = "__partial_interlocutor__";
const PARTIAL_AI_ID = "__partial_ai__";

export const useCallStore = create<CallState>((set) => ({
  status: "idle",
  wsConnected: false,
  connectStartedAt: null,
  bubbles: [],
  suggestions: [],
  aiThinking: false,
  usageTick: null,
  pendingAiReply: null,
  autoMode: true,
  activeStyleId: null,
  activeVoice: null,
  activeLlmProvider: null,
  activeLlmModel: null,
  activeSttProvider: null,
  activeSttModel: null,
  activeTtsProvider: null,
  lastStreamId: null,
  toastError: null,
  fatalError: null,
  endInfo: null,

  reset: () =>
    set({
      status: "idle",
      wsConnected: false,
      connectStartedAt: null,
      bubbles: [],
      suggestions: [],
      aiThinking: false,
      usageTick: null,
      pendingAiReply: null,
      // Don't reset autoMode — it's a per-session preference the user
      // set in the drawer and expects to persist across reconnects
      // within the same call. The next start() picks up the same value.
      activeStyleId: null,
      activeVoice: null,
      activeLlmProvider: null,
      activeLlmModel: null,
      activeSttProvider: null,
      activeSttModel: null,
      activeTtsProvider: null,
      lastStreamId: null,
      toastError: null,
      fatalError: null,
      endInfo: null,
    }),

  setStatus: (status) =>
    set((prev) => {
      // Stamp the connect-start time the first time we enter the
      // connecting phase so the UI can compute elapsed-time-based
      // copy ("still ringing…") and the watchdog can time out.
      const connectStartedAt =
        (status === "connecting" || status === "ringing") &&
        prev.connectStartedAt === null
          ? Date.now()
          : status === "active" || status === "ended"
            ? null
            : prev.connectStartedAt;
      return { status, connectStartedAt };
    }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setPendingAiReply: (reply) =>
    // A non-null candidate means the AI finished generating — drop the
    // "thinking" indicator so it doesn't linger behind the preview card.
    set(reply ? { pendingAiReply: reply, aiThinking: false } : { pendingAiReply: reply }),
  setAutoMode: (enabled) => set({ autoMode: enabled }),
  setActiveStyleId: (styleId) => set({ activeStyleId: styleId }),
  setActiveVoice: (voice) => set({ activeVoice: voice }),
  setActiveLlm: (provider, model) =>
    set({ activeLlmProvider: provider, activeLlmModel: model }),
  setActiveStt: (provider, model) =>
    set({ activeSttProvider: provider, activeSttModel: model }),
  setActiveTts: (provider, voice) =>
    set({ activeTtsProvider: provider, activeVoice: voice }),
  setLastStreamId: (id) => set({ lastStreamId: id }),

  setInterlocutorPartial: (text) =>
    set((s) => {
      const others = s.bubbles.filter((b) => b.id !== PARTIAL_INTERLOCUTOR_ID);
      return {
        bubbles: [
          ...others,
          {
            id: PARTIAL_INTERLOCUTOR_ID,
            role: "interlocutor",
            content: text,
            partial: true,
            ts: Date.now(),
          },
        ],
      };
    }),

  commitInterlocutorFinal: (messageId, text) =>
    set((s) => {
      const others = s.bubbles.filter((b) => b.id !== PARTIAL_INTERLOCUTOR_ID);
      return {
        bubbles: [
          ...others,
          {
            id: messageId,
            role: "interlocutor",
            content: text,
            partial: false,
            ts: Date.now(),
          },
        ],
      };
    }),

  setAiPartial: (text) =>
    set((s) => {
      const others = s.bubbles.filter((b) => b.id !== PARTIAL_AI_ID);
      return {
        bubbles: [
          ...others,
          {
            id: PARTIAL_AI_ID,
            role: "ai",
            content: text,
            partial: true,
            ts: Date.now(),
          },
        ],
        aiThinking: false,
      };
    }),

  commitAiFinal: (messageId, text, kind) =>
    set((s) => {
      const others = s.bubbles.filter((b) => b.id !== PARTIAL_AI_ID);
      return {
        bubbles: [
          ...others,
          {
            id: messageId,
            role: "ai",
            content: text,
            partial: false,
            ts: Date.now(),
            kind: kind ?? "normal",
          },
        ],
        aiThinking: false,
      };
    }),

  setAiThinking: (active) => set({ aiThinking: active }),

  pushUserTyped: (content) =>
    set((s) => ({
      bubbles: [
        ...s.bubbles,
        {
          id: nextLocalId(),
          role: "user",
          content,
          partial: false,
          ts: Date.now(),
        },
      ],
      // Sending a message invalidates any old suggestions — they were for the
      // prior interlocutor turn.
      suggestions: [],
    })),

  pushSystem: (content) =>
    set((s) => ({
      bubbles: [
        ...s.bubbles,
        {
          id: nextLocalId(),
          role: "system",
          content,
          partial: false,
          ts: Date.now(),
        },
      ],
    })),

  setSuggestions: (items) => set({ suggestions: items }),
  removeSuggestion: (id) =>
    set((s) => ({ suggestions: s.suggestions.filter((x) => x.id !== id) })),

  setUsageTick: (tick) => set({ usageTick: tick }),

  setToastError: (err) => set({ toastError: err }),
  setFatalError: (err) => set({ fatalError: err }),

  setEndInfo: (info) => set({ endInfo: info, status: "ended" }),
}));
