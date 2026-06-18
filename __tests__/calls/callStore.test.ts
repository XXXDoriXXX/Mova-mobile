import { useCallStore } from "@/features/calls/live/callStore";

const get = () => useCallStore.getState();

beforeEach(() => {
  useCallStore.getState().reset();
});

afterEach(() => {
  // reset() also clears the pending interlocutor seal timer.
  useCallStore.getState().reset();
});

describe("callStore reducer", () => {
  it("starts idle with empty bubbles + suggestions", () => {
    expect(get().status).toBe("idle");
    expect(get().bubbles).toEqual([]);
    expect(get().suggestions).toEqual([]);
  });

  it("interlocutor: partials grow one bubble, a quick final merges, silence seals it", () => {
    jest.useFakeTimers();
    try {
      get().setInterlocutorPartial("Привіт, це");
      expect(get().bubbles).toHaveLength(1);
      expect(get().bubbles[0]?.partial).toBe(true);
      expect(get().bubbles[0]?.content).toBe("Привіт, це");
      const turnId = get().bubbles[0]?.id;

      get().setInterlocutorPartial("Привіт, це Іван");
      expect(get().bubbles).toHaveLength(1);
      expect(get().bubbles[0]?.id).toBe(turnId);
      expect(get().bubbles[0]?.content).toBe("Привіт, це Іван");

      // A finalised segment arriving right away merges into the same bubble and
      // the turn is still "speaking" (more segments may follow a micro-pause).
      get().commitInterlocutorFinal(
        "33333333-3333-3333-3333-333333333333",
        "Привіт, це Іван.",
      );
      expect(get().bubbles).toHaveLength(1);
      expect(get().bubbles[0]?.id).toBe(turnId);
      expect(get().bubbles[0]?.content).toBe("Привіт, це Іван.");
      expect(get().bubbles[0]?.partial).toBe(true);

      // Silence longer than the merge gap → seal: speaking stops, turn cleared.
      jest.advanceTimersByTime(3100);
      expect(get().bubbles[0]?.partial).toBe(false);
      expect(get().interlocutorTurn).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("endInterlocutorTurn seals the bubble now; a quick continuation re-merges", () => {
    jest.useFakeTimers();
    try {
      get().commitInterlocutorFinal("m1", "перша частина");
      const id = get().bubbles[0]?.id;
      expect(get().bubbles[0]?.partial).toBe(true);

      // backend's authoritative endpoint → seal immediately (no waiting for timer)
      get().endInterlocutorTurn();
      expect(get().bubbles).toHaveLength(1);
      expect(get().bubbles[0]?.partial).toBe(false);

      // a backend over-split (sentence continued after a long pause) merges back
      get().commitInterlocutorFinal("m2", "друга частина");
      expect(get().bubbles).toHaveLength(1);
      expect(get().bubbles[0]?.id).toBe(id);
      expect(get().bubbles[0]?.content).toBe("перша частина друга частина");
      expect(get().bubbles[0]?.partial).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it("ai partial → final overwrites and clears thinking indicator", () => {
    get().setAiThinking(true);
    expect(get().aiThinking).toBe(true);

    get().setAiPartial("Доб");
    expect(get().aiThinking).toBe(false);

    get().setAiPartial("Доброго дня");
    expect(get().bubbles).toHaveLength(1);
    expect(get().bubbles[0]?.role).toBe("ai");

    get().commitAiFinal("44444444-4444-4444-4444-444444444444", "Доброго дня.");
    expect(get().bubbles).toHaveLength(1);
    expect(get().bubbles[0]?.partial).toBe(false);
    expect(get().bubbles[0]?.id).toBe("44444444-4444-4444-4444-444444444444");
  });

  it("pushing a user-typed message clears any pending suggestions", () => {
    get().setSuggestions([
      { id: "55555555-5555-5555-5555-555555555551", content: "Так" },
      { id: "55555555-5555-5555-5555-555555555552", content: "Ні" },
    ]);
    expect(get().suggestions).toHaveLength(2);
    get().pushUserTyped("Доброго дня");
    expect(get().suggestions).toHaveLength(0);
    expect(get().bubbles).toHaveLength(1);
    expect(get().bubbles[0]?.role).toBe("user");
  });

  it("setEndInfo flips status to ended and stores reason", () => {
    get().setStatus("active");
    get().setEndInfo({
      reason: "balance",
      durationSeconds: 320,
      endedBy: "system",
    });
    expect(get().status).toBe("ended");
    expect(get().endInfo?.reason).toBe("balance");
    expect(get().endInfo?.endedBy).toBe("system");
  });

  it("usageTick maps free + paid plans distinctly", () => {
    get().setUsageTick({
      secondsElapsed: 30,
      secondsRemaining: 270,
      planCode: "free",
    });
    expect(get().usageTick?.planCode).toBe("free");
    expect(get().usageTick?.secondsRemaining).toBe(270);

    get().setUsageTick({
      secondsElapsed: 60,
      secondsRemaining: null,
      planCode: "paid",
    });
    expect(get().usageTick?.planCode).toBe("paid");
    expect(get().usageTick?.secondsRemaining).toBeNull();
  });

  it("removeSuggestion removes by id, leaves others", () => {
    get().setSuggestions([
      { id: "a", content: "A" },
      { id: "b", content: "B" },
      { id: "c", content: "C" },
    ]);
    get().removeSuggestion("b");
    expect(get().suggestions.map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("reset() returns to idle state with everything cleared", () => {
    get().setStatus("active");
    get().pushUserTyped("anything");
    get().setSuggestions([{ id: "x", content: "y" }]);
    get().setActiveStyleId("builtin:friendly");
    get().reset();
    expect(get().status).toBe("idle");
    expect(get().bubbles).toEqual([]);
    expect(get().suggestions).toEqual([]);
    expect(get().activeStyleId).toBeNull();
  });
});
