import { create } from "zustand";

import {
  clearPendingVerification,
  loadPendingVerification,
  savePendingVerification,
  type PendingVerification,
} from "./pendingVerification";

type PendingVerificationState = {
  // "unknown" until hydrated, then the record or null.
  status: "unknown" | "ready";
  pending: PendingVerification | null;
  hydrate: () => Promise<void>;
  set: (value: PendingVerification) => Promise<void>;
  clear: () => Promise<void>;
};

export const usePendingVerificationStore = create<PendingVerificationState>(
  (set) => ({
    status: "unknown",
    pending: null,
    async hydrate() {
      const pending = await loadPendingVerification();
      set({ status: "ready", pending });
    },
    async set(value) {
      await savePendingVerification(value);
      set({ status: "ready", pending: value });
    },
    async clear() {
      await clearPendingVerification();
      set({ status: "ready", pending: null });
    },
  }),
);
