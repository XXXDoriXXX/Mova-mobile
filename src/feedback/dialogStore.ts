import { create } from "zustand";

import { triggerHaptic } from "@/utils/haptics";

/**
 * Imperative confirm + action-sheet system. Replaces RN's
 * `Alert.alert` calls with brand-styled bottom sheets so the dialogs
 * match the rest of the visual language.
 *
 * Confirm:
 *   const ok = await confirm({ title, confirmLabel, destructive: true });
 *   if (!ok) return;
 *
 * Action sheet:
 *   const choice = await actionSheet({
 *     title,
 *     actions: [
 *       { id: "share", label: "Поділитись", icon: "share-outline" },
 *       { id: "delete", label: "Видалити", destructive: true },
 *     ],
 *   });
 *
 * Both APIs return a promise that resolves when the user picks (or
 * dismisses). The visual hosts (ConfirmDialogHost, ActionSheetHost)
 * subscribe to the store and render the sheets — split from the store
 * so this module stays test-friendly (no JSX deps).
 */

export type ConfirmRequest = {
  id: string;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Optional Ionicons name shown as the dialog's hero icon. */
  icon?: string;
  /** Resolved by the host when the user taps a button or dismisses. */
  resolve: (confirmed: boolean) => void;
};

export type ActionItem = {
  id: string;
  label: string;
  /** Optional Ionicons name. */
  icon?: string;
  destructive?: boolean;
};

export type ActionSheetRequest = {
  id: string;
  title?: string;
  body?: string;
  actions: ActionItem[];
  resolve: (chosenId: string | null) => void;
};

interface DialogStore {
  confirm: ConfirmRequest | null;
  sheet: ActionSheetRequest | null;
  openConfirm: (req: ConfirmRequest) => void;
  resolveConfirm: (confirmed: boolean) => void;
  openSheet: (req: ActionSheetRequest) => void;
  resolveSheet: (chosenId: string | null) => void;
}

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${++counter}`;

export const useDialogStore = create<DialogStore>((set, get) => ({
  confirm: null,
  sheet: null,
  openConfirm: (req) => set({ confirm: req }),
  resolveConfirm: (confirmed) => {
    const cur = get().confirm;
    if (!cur) return;
    cur.resolve(confirmed);
    set({ confirm: null });
  },
  openSheet: (req) => set({ sheet: req }),
  resolveSheet: (id) => {
    const cur = get().sheet;
    if (!cur) return;
    cur.resolve(id);
    set({ sheet: null });
  },
}));

/**
 * Imperative confirm. Returns a promise that resolves true if the user
 * confirms, false if they cancel or dismiss. Fires a "warning" haptic
 * for destructive dialogs the moment they appear so the user feels
 * the gravity before they read it.
 */
export function confirm(
  options: Omit<ConfirmRequest, "id" | "resolve">,
): Promise<boolean> {
  if (options.destructive) triggerHaptic("warning");
  return new Promise<boolean>((resolve) => {
    useDialogStore.getState().openConfirm({
      id: nextId("confirm"),
      ...options,
      resolve,
    });
  });
}

/**
 * Imperative action sheet. Returns the chosen action id (or null if
 * dismissed). Fires a selection haptic on present.
 */
export function actionSheet(
  options: Omit<ActionSheetRequest, "id" | "resolve">,
): Promise<string | null> {
  triggerHaptic("selection");
  return new Promise<string | null>((resolve) => {
    useDialogStore.getState().openSheet({
      id: nextId("sheet"),
      ...options,
      resolve,
    });
  });
}
