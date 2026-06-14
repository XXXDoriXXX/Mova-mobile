import { useCallStore } from "@/features/calls/live/callStore";

const get = () => useCallStore.getState();

beforeEach(() => {
  useCallStore.getState().reset();
});

describe("callStore reducer", () => {
  it("starts idle with empty bubbles + suggestions", () => {
    expect(get().status).toBe("idle");
    expect(get().bubbles).toEqual([]);
    expect(get().suggestions).toEqual([]);
  });

  it("interlocutor partial → final replaces the partial bubble in place", () => {
    get().setInterlocutorPartial("Привіт, це");
    expect(get().bubbles).toHaveLength(1);
    expect(get().bubbles[0]?.partial).toBe(true);
    expect(get().bubbles[0]?.content).toBe("Привіт, це");

    get().setInterlocutorPartial("Привіт, це Іван");
    expect(get().bubbles).toHaveLength(1);
    expect(get().bubbles[0]?.content).toBe("Привіт, це Іван");

    get().commitInterlocutorFinal(
      "33333333-3333-3333-3333-333333333333",
      "Привіт, це Іван.",
    );
    expect(get().bubbles).toHaveLength(1);
    expect(get().bubbles[0]?.partial).toBe(false);
    expect(get().bubbles[0]?.id).toBe("33333333-3333-3333-3333-333333333333");
    expect(get().bubbles[0]?.content).toBe("Привіт, це Іван.");
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
