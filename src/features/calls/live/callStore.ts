import { create } from "zustand";

import type { CallErrorCode } from "@/realtime/error-codes";

import {
  nextStatusState,
  pendingAiReplyChange,
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
  /** Specific cause (CallErrorCode string) when present — drives the precise
   *  end-screen message. */
  errorCode?: string;
  /** Whether the call was ever answered — words the screen + gates redial. */
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
    set((s) => ({ bubbles: withInterlocutorPartial(s.bubbles, text, Date.now()) })),
  commitInterlocutorFinal: (messageId, text) =>
    set((s) => ({
      bubbles: withInterlocutorFinal(s.bubbles, messageId, text, Date.now()),
    })),

  setAiPartial: (text) =>
    set((s) => ({
      bubbles: withAiPartial(s.bubbles, text, Date.now()),
      aiThinking: false,
    })),
  commitAiFinal: (messageId, text, kind) =>
    set((s) => ({
      bubbles: withAiFinal(s.bubbles, messageId, text, Date.now(), kind),
      aiThinking: false,
    })),
  setAiThinking: (active) => set({ aiThinking: active }),

  pushUserTyped: (content) =>
    set((s) => ({
      bubbles: withUserTyped(s.bubbles, nextLocalId(), content, Date.now()),
      suggestions: [],
    })),
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
}));
