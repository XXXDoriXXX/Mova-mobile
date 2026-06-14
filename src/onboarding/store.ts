import { create } from "zustand";

import { isOnboardingCompleted, markOnboardingCompleted } from "./storage";

type OnboardingState = {
  status: "unknown" | "needed" | "done";
  hydrate: () => Promise<void>;
  complete: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  status: "unknown",
  async hydrate() {
    if (__DEV__) console.log("[mova/onboarding] hydrate: start");
    try {
      const done = await isOnboardingCompleted();
      if (__DEV__) console.log("[mova/onboarding] hydrate:", done ? "done" : "needed");
      set({ status: done ? "done" : "needed" });
    } catch (err) {
      if (__DEV__) console.warn("[mova/onboarding] hydrate failed → assuming needed:", err);
      set({ status: "needed" });
    }
  },
  async complete() {
    await markOnboardingCompleted();
    set({ status: "done" });
  },
}));
