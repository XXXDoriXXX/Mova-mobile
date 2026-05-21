import { create } from "zustand";

import { triggerHaptic } from "@/utils/haptics";

/**
 * Pure data layer for the toast system — split out from `ToastHost.tsx`
 * so it can be imported by tests + non-React modules (mutation
 * handlers, imperative API) without dragging in the Reanimated /
 * vector-icons dependency graph that the visual component needs.
 *
 * Up to `MAX_VISIBLE` toasts can stack at once — older toasts shuffle
 * up to make room and animate out when their timer expires (the host
 * handles that via Reanimated `Layout` transitions). When the queue
 * is full the oldest is evicted immediately so the latest is always
 * visible.
 *
 * `toast.<variant>()` is the one-call ergonomic entry point:
 *   - emits the variant-appropriate haptic
 *   - pushes the toast model into the store (with stacking semantics)
 */

export const MAX_VISIBLE = 3;

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastModel {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
}

interface ToastStore {
  queue: ToastModel[];
  push: (toast: Omit<ToastModel, "id">) => void;
  dismiss: (id: string) => void;
  /** Drops every toast — used by tests and the auth flow on logout. */
  clear: () => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  queue: [],
  push: (next) => {
    counter += 1;
    const entry: ToastModel = { ...next, id: `toast-${counter}` };
    set((state) => {
      const trimmed =
        state.queue.length >= MAX_VISIBLE
          ? state.queue.slice(state.queue.length - (MAX_VISIBLE - 1))
          : state.queue;
      return { queue: [...trimmed, entry] };
    });
  },
  dismiss: (id) =>
    set((state) => ({ queue: state.queue.filter((t) => t.id !== id) })),
  clear: () => set({ queue: [] }),
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
