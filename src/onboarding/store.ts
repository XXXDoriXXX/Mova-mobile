import { create } from "zustand";

import { isOnboardingCompleted, markOnboardingCompleted } from "./storage";

type OnboardingState = {
  status: "unknown" | "needed" | "done";
  hydrate: () => Promise<void>;
  complete: () => Promise<void>;
};

/**
 * Tracks whether the user has finished the welcome wizard on this device.
 * Lives in a tiny standalone store so AuthGate and OnboardingScreen agree
 * on a single source of truth — re-reading SecureStore on every navigation
 * tick is unnecessary I/O.
 */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  status: "unknown",
  async hydrate() {
    const done = await isOnboardingCompleted();
    set({ status: done ? "done" : "needed" });
  },
  async complete() {
    await markOnboardingCompleted();
    set({ status: "done" });
  },
}));
