import {
  MAX_VISIBLE,
  toast,
  useToastStore,
} from "@/feedback/toastStore";

describe("toast store", () => {
  beforeEach(() => {
    useToastStore.getState().clear();
  });

  it("pushes a success toast with the right variant", () => {
    toast.success("Saved");
    const queue = useToastStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0]?.variant).toBe("success");
    expect(queue[0]?.message).toBe("Saved");
  });

  it("stacks multiple toasts in order (newest last)", () => {
    toast.info("First");
    toast.error("Second");
    const queue = useToastStore.getState().queue;
    expect(queue.map((t) => t.message)).toEqual(["First", "Second"]);
    expect(queue.map((t) => t.variant)).toEqual(["info", "error"]);
  });

  it("evicts oldest when the queue exceeds MAX_VISIBLE", () => {
    const pushed = MAX_VISIBLE + 2;
    for (let i = 0; i < pushed; i++) toast.info(`m${i}`);
    const queue = useToastStore.getState().queue;
    expect(queue).toHaveLength(MAX_VISIBLE);
    // The last MAX_VISIBLE messages survived; the leading ones were dropped.
    const expected = Array.from(
      { length: MAX_VISIBLE },
      (_, i) => `m${pushed - MAX_VISIBLE + i}`,
    );
    expect(queue.map((t) => t.message)).toEqual(expected);
  });

  it("dismiss removes the matching toast by id", () => {
    toast.warning("Heads up");
    toast.success("Saved");
    const [first, second] = useToastStore.getState().queue;
    useToastStore.getState().dismiss(first!.id);
    const remaining = useToastStore.getState().queue;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(second!.id);
  });

  it("title is optional", () => {
    toast.success("Just a message");
    expect(useToastStore.getState().queue[0]?.title).toBeUndefined();
    toast.success("Body", "Title");
    expect(useToastStore.getState().queue[1]?.title).toBe("Title");
  });

  it("clear drops all toasts", () => {
    toast.info("a");
    toast.info("b");
    useToastStore.getState().clear();
    expect(useToastStore.getState().queue).toEqual([]);
  });
});
