import { toast, useToastStore } from "@/feedback/toastStore";

// triggerHaptic touches expo-haptics, which jest-expo stubs to a no-op.
// We exercise the store mutations directly here — the visual `ToastHost`
// is rendered separately and not the unit under test.

describe("toast store", () => {
  beforeEach(() => {
    useToastStore.getState().dismiss();
  });

  it("pushes a success toast with the right variant", () => {
    toast.success("Saved");
    const cur = useToastStore.getState().current;
    expect(cur?.variant).toBe("success");
    expect(cur?.message).toBe("Saved");
  });

  it("replaces (not stacks) when called twice in a row", () => {
    toast.info("First");
    const firstId = useToastStore.getState().current?.id;
    toast.error("Second");
    const second = useToastStore.getState().current;
    expect(second?.message).toBe("Second");
    expect(second?.variant).toBe("error");
    expect(second?.id).not.toBe(firstId);
  });

  it("dismiss clears the current toast", () => {
    toast.warning("Heads up");
    expect(useToastStore.getState().current).not.toBeNull();
    useToastStore.getState().dismiss();
    expect(useToastStore.getState().current).toBeNull();
  });

  it("title is optional", () => {
    toast.success("Just a message");
    expect(useToastStore.getState().current?.title).toBeUndefined();
    toast.success("Body", "Title");
    expect(useToastStore.getState().current?.title).toBe("Title");
  });
});
