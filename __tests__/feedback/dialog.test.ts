import { actionSheet, confirm, useDialogStore } from "@/feedback/dialogStore";

describe("dialog store", () => {
  beforeEach(() => {
    useDialogStore.getState().resolveConfirm(false);
    useDialogStore.getState().resolveSheet(null);
  });

  it("confirm() opens a request and resolves true when accepted", async () => {
    const promise = confirm({
      title: "Are you sure?",
      confirmLabel: "Yes",
    });
    const req = useDialogStore.getState().confirm;
    expect(req?.title).toBe("Are you sure?");
    expect(req?.confirmLabel).toBe("Yes");
    useDialogStore.getState().resolveConfirm(true);
    await expect(promise).resolves.toBe(true);
    expect(useDialogStore.getState().confirm).toBeNull();
  });

  it("confirm() resolves false on cancel / dismiss", async () => {
    const promise = confirm({ title: "X", confirmLabel: "Yes" });
    useDialogStore.getState().resolveConfirm(false);
    await expect(promise).resolves.toBe(false);
  });

  it("destructive confirm preserves the flag for the host", async () => {
    const promise = confirm({
      title: "Delete?",
      confirmLabel: "Delete",
      destructive: true,
    });
    expect(useDialogStore.getState().confirm?.destructive).toBe(true);
    useDialogStore.getState().resolveConfirm(false);
    await promise;
  });

  it("actionSheet() resolves with the chosen id", async () => {
    const promise = actionSheet({
      actions: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
    });
    expect(useDialogStore.getState().sheet?.actions).toHaveLength(2);
    useDialogStore.getState().resolveSheet("b");
    await expect(promise).resolves.toBe("b");
  });

  it("actionSheet() resolves null when dismissed", async () => {
    const promise = actionSheet({
      actions: [{ id: "a", label: "A" }],
    });
    useDialogStore.getState().resolveSheet(null);
    await expect(promise).resolves.toBeNull();
  });
});
