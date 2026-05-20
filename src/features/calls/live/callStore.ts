import { create } from "zustand";

import type { CallErrorCode } from "@/realtime/error-codes";

export type CallStatus =
  | "idle"
  | "connecting"
  | "active"
  | "reconnecting"
  | "ended";

export type Bubble = {
  id: string;
  role: "interlocutor" | "ai" | "user" | "system";
  content: string;
  partial: boolean;
  ts: number;
};

export type CallSuggestion = { id: string; content: string };

export type CallError = {
  code: CallErrorCode;
  message: string;
  recoverable: boolean;
};

export type CallEnd = {
  endReason: string;
  durationSeconds: number;
};

export type UsageTick = {
  secondsElapsed: number;
  balanceCents?: number;
  freeSecondsRemaining?: number;
};

type CallState = {
  status: CallStatus;
  bubbles: Bubble[];
  suggestions: CallSuggestion[];
  aiThinking: boolean;
  usageTick: UsageTick | null;
  activeStyleId: string | null;
  lastStreamId: string | null;
  toastError: CallError | null;
  fatalError: CallError | null;
  endInfo: CallEnd | null;

  reset: () => void;
  setStatus: (status: CallStatus) => void;
  setActiveStyleId: (styleId: string | null) => void;
  setLastStreamId: (id: string | null) => void;

  setInterlocutorPartial: (content: string) => void;
  commitInterlocutorFinal: (messageId: string, content: string) => void;

  setAiPartial: (content: string) => void;
  commitAiFinal: (messageId: string, content: string) => void;
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
  bubbles: [],
  suggestions: [],
  aiThinking: false,
  usageTick: null,
  activeStyleId: null,
  lastStreamId: null,
  toastError: null,
  fatalError: null,
  endInfo: null,

  reset: () =>
    set({
      status: "idle",
      bubbles: [],
      suggestions: [],
      aiThinking: false,
      usageTick: null,
      activeStyleId: null,
      lastStreamId: null,
      toastError: null,
      fatalError: null,
      endInfo: null,
    }),

  setStatus: (status) => set({ status }),
  setActiveStyleId: (styleId) => set({ activeStyleId: styleId }),
  setLastStreamId: (id) => set({ lastStreamId: id }),

  setInterlocutorPartial: (content) =>
    set((s) => {
      const others = s.bubbles.filter((b) => b.id !== PARTIAL_INTERLOCUTOR_ID);
      return {
        bubbles: [
          ...others,
          {
            id: PARTIAL_INTERLOCUTOR_ID,
            role: "interlocutor",
            content,
            partial: true,
            ts: Date.now(),
          },
        ],
      };
    }),

  commitInterlocutorFinal: (messageId, content) =>
    set((s) => {
      const others = s.bubbles.filter((b) => b.id !== PARTIAL_INTERLOCUTOR_ID);
      return {
        bubbles: [
          ...others,
          {
            id: messageId,
            role: "interlocutor",
            content,
            partial: false,
            ts: Date.now(),
          },
        ],
      };
    }),

  setAiPartial: (content) =>
    set((s) => {
      const others = s.bubbles.filter((b) => b.id !== PARTIAL_AI_ID);
      return {
        bubbles: [
          ...others,
          {
            id: PARTIAL_AI_ID,
            role: "ai",
            content,
            partial: true,
            ts: Date.now(),
          },
        ],
        aiThinking: false,
      };
    }),

  commitAiFinal: (messageId, content) =>
    set((s) => {
      const others = s.bubbles.filter((b) => b.id !== PARTIAL_AI_ID);
      return {
        bubbles: [
          ...others,
          {
            id: messageId,
            role: "ai",
            content,
            partial: false,
            ts: Date.now(),
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
