import { create } from "zustand";

import { triggerHaptic } from "@/utils/haptics";

export type ConfirmRequest = {
  id: string;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: string;
  resolve: (confirmed: boolean) => void;
};

export type ActionItem = {
  id: string;
  label: string;
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
