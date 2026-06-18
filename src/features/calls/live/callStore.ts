import { create } from "zustand";

import type { CallErrorCode } from "@/realtime/error-codes";

import {
  INTERLOCUTOR_MERGE_GAP_MS,
  nextStatusState,
  pendingAiReplyChange,
  sealInterlocutorTurn,
  withAiFinal,
  withAiPartial,
  withInterlocutorFinal,
  withInterlocutorPartial,
  withSystem,
  withUserTyped,
} from "./application/callStoreReducers";

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
  kind?: "normal" | "fallback" | "idle_probe";
};

// Accumulator for the interlocutor's current speaking turn — the bubble id its
// segments merge into, the text committed so far, and when we last heard a
// segment (used to decide micro-pause-merge vs new turn). Null = no live turn.
export type InterlocutorTurn = { id: string; committed: string; lastTs: number } | null;

export type CallSuggestion = {
  id: string;
  content: string;
};

export type PendingAiReply = {
  candidateId: string;
  text: string;
  autoAcceptInMs: number | null;
  receivedAt: number;
  streaming: boolean;
};

export type CallError = {
  code: CallErrorCode;
  message: string;
  recoverable: boolean;
};

export type CallEnd = {
  reason:
    | "user"
    | "interlocutor"
    | "no_answer"
    | "balance"
    | "fatal_error"
    | "timeout"
    | "admin";
  durationSeconds: number;
  endedBy: "user" | "system" | "interlocutor" | "admin";
  errorCode?: string;
  wasAnswered?: boolean;
};

export type UsageTick = {
  secondsElapsed: number;
  secondsRemaining: number | null;
  planCode: "free" | "paid";
};

type CallState = {
  status: CallStatus;
  wsConnected: boolean;
  connectStartedAt: number | null;
  bubbles: Bubble[];
  interlocutorTurn: InterlocutorTurn;
  suggestions: CallSuggestion[];
  aiThinking: boolean;
  usageTick: UsageTick | null;
  pendingAiReply: PendingAiReply | null;
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
  endInterlocutorTurn: () => void;

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
let turnCounter = 0;
const nextTurnId = () => `turn-${++turnCounter}`;

export const useCallStore = create<CallState>((set) => {
  // Fires after a silence longer than the merge gap: the interlocutor stopped,
  // so seal the turn (drop the "speaking" state, allow the next segment to open
  // a fresh bubble). Module-scoped so re-arming clears the previous one.
  let sealTimer: ReturnType<typeof setTimeout> | null = null;
  const clearSeal = () => {
    if (sealTimer) {
      clearTimeout(sealTimer);
      sealTimer = null;
    }
  };
  const armSeal = () => {
    clearSeal();
    sealTimer = setTimeout(() => {
      sealTimer = null;
      set((s) => ({
        bubbles: sealInterlocutorTurn(s.bubbles, s.interlocutorTurn),
        interlocutorTurn: null,
      }));
    }, INTERLOCUTOR_MERGE_GAP_MS);
  };
  // The other party started speaking → end any live interlocutor turn at once.
  const sealedFor = (s: CallState) => {
    clearSeal();
    return {
      bubbles: sealInterlocutorTurn(s.bubbles, s.interlocutorTurn),
      interlocutorTurn: null as InterlocutorTurn,
    };
  };

  return {
  status: "idle",
  wsConnected: false,
  connectStartedAt: null,
  bubbles: [],
  interlocutorTurn: null,
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

  reset: () => {
    clearSeal();
    set({
      status: "idle",
      wsConnected: false,
      connectStartedAt: null,
      bubbles: [],
      interlocutorTurn: null,
      suggestions: [],
      aiThinking: false,
      usageTick: null,
      pendingAiReply: null,
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
    });
  },

  setStatus: (status) =>
    set((prev) =>
      nextStatusState(prev.status, prev.connectStartedAt, status, Date.now()),
    ),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setPendingAiReply: (reply) => set(pendingAiReplyChange(reply)),
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
      const { bubbles, turn } = withInterlocutorPartial(
        s.bubbles,
        s.interlocutorTurn,
        text,
        Date.now(),
        nextTurnId,
      );
      armSeal();
      return { bubbles, interlocutorTurn: turn };
    }),
  commitInterlocutorFinal: (messageId, text) =>
    set((s) => {
      const { bubbles, turn } = withInterlocutorFinal(
        s.bubbles,
        s.interlocutorTurn,
        text,
        Date.now(),
        () => messageId,
      );
      armSeal();
      return { bubbles, interlocutorTurn: turn };
    }),
  // Authoritative end-of-turn from the backend (real endpoint). Seal the bubble
  // now instead of waiting for the local fallback timer. The turn + timer are
  // kept so a quick continuation (backend split a sentence on a long pause)
  // still merges into this bubble within the gap rather than starting a new one.
  endInterlocutorTurn: () =>
    set((s) => ({ bubbles: sealInterlocutorTurn(s.bubbles, s.interlocutorTurn) })),

  setAiPartial: (text) =>
    set((s) => {
      const sealed = sealedFor(s);
      return {
        ...sealed,
        bubbles: withAiPartial(sealed.bubbles, text, Date.now()),
        aiThinking: false,
      };
    }),
  commitAiFinal: (messageId, text, kind) =>
    set((s) => {
      const sealed = sealedFor(s);
      return {
        ...sealed,
        bubbles: withAiFinal(sealed.bubbles, messageId, text, Date.now(), kind),
        aiThinking: false,
      };
    }),
  setAiThinking: (active) => set({ aiThinking: active }),

  pushUserTyped: (content) =>
    set((s) => {
      const sealed = sealedFor(s);
      return {
        ...sealed,
        bubbles: withUserTyped(sealed.bubbles, nextLocalId(), content, Date.now()),
        suggestions: [],
        // The user took over the turn (manual text or a chosen suggestion) — drop
        // the pending AI candidate card so it isn't left on screen after they
        // spoke their own reply. The backend cancels it too; this is the
        // optimistic mirror so the UI and the agent agree.
        pendingAiReply: null,
      };
    }),
  pushSystem: (content) =>
    set((s) => ({
      bubbles: withSystem(s.bubbles, nextLocalId(), content, Date.now()),
    })),

  setSuggestions: (items) => set({ suggestions: items }),
  removeSuggestion: (id) =>
    set((s) => ({ suggestions: s.suggestions.filter((x) => x.id !== id) })),

  setUsageTick: (tick) => set({ usageTick: tick }),

  setToastError: (err) => set({ toastError: err }),
  setFatalError: (err) => set({ fatalError: err }),

  setEndInfo: (info) => set({ endInfo: info, status: "ended" }),
  };
});
