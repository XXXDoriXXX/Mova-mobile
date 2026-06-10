import { create } from "zustand";

import type { IncomingCall } from "@/types/api";

export type OutgoingStatus =
  | "ringing"
  | "accepted"
  | "declined"
  | "cancelled"
  | null;

export type OutgoingCall = {
  conversationId: string;
  calleeName: string;
  status: OutgoingStatus;
};

type CallSignalState = {
  incoming: IncomingCall | null;
  outgoing: OutgoingCall | null;
  setIncoming: (call: IncomingCall | null) => void;
  setOutgoing: (call: OutgoingCall | null) => void;
  setOutgoingStatus: (status: OutgoingStatus) => void;
  clearForConversation: (conversationId: string) => void;
  reset: () => void;
};

export const useCallSignalStore = create<CallSignalState>((set) => ({
  incoming: null,
  outgoing: null,
  setIncoming: (incoming) => set({ incoming }),
  setOutgoing: (outgoing) => set({ outgoing }),
  setOutgoingStatus: (status) =>
    set((s) => (s.outgoing ? { outgoing: { ...s.outgoing, status } } : s)),
  clearForConversation: (conversationId) =>
    set((s) => ({
      incoming:
        s.incoming?.conversationId === conversationId ? null : s.incoming,
      outgoing:
        s.outgoing?.conversationId === conversationId ? null : s.outgoing,
    })),
  reset: () => set({ incoming: null, outgoing: null }),
}));
