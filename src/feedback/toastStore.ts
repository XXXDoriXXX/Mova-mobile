import { create } from "zustand";

import { triggerHaptic } from "@/utils/haptics";

/**
 * Pure data layer for the toast system — split out from `ToastHost.tsx`
 * so it can be imported by tests + non-React modules (mutations,
 * imperative API) without dragging in the Reanimated / vector-icons
 * dependency graph that the visual component needs.
 *
 * `toast.<variant>()` is the one-call ergonomic entry point:
 *   - emits the haptic appropriate to the variant
 *   - pushes the toast model into the store (replacing any prior one)
 *
 * The `ToastHost` component subscribes and renders the result.
 */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastModel {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
}

interface ToastStore {
  current: ToastModel | null;
  push: (toast: Omit<ToastModel, "id">) => void;
  dismiss: () => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  current: null,
  push: (next) => {
    counter += 1;
    set({ current: { ...next, id: `toast-${counter}` } });
  },
  dismiss: () => set({ current: null }),
}));

export const toast = {
  success(message: string, title?: string): void {
    triggerHaptic("success");
    useToastStore.getState().push({ variant: "success", message, title });
  },
  error(message: string, title?: string): void {
    triggerHaptic("error");
    useToastStore.getState().push({ variant: "error", message, title });
  },
  warning(message: string, title?: string): void {
    triggerHaptic("warning");
    useToastStore.getState().push({ variant: "warning", message, title });
  },
  info(message: string, title?: string): void {
    triggerHaptic("selection");
    useToastStore.getState().push({ variant: "info", message, title });
  },
};
