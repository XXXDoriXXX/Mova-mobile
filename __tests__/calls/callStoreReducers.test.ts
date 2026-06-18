import {
  INTERLOCUTOR_MERGE_GAP_MS,
  nextStatusState,
  PARTIAL_AI_ID,
  pendingAiReplyChange,
  sealInterlocutorTurn,
  withAiFinal,
  withAiPartial,
  withInterlocutorFinal,
  withInterlocutorPartial,
  withSystem,
  withUserTyped,
} from "@/features/calls/live/application/callStoreReducers";
import {
  useCallStore,
  type Bubble,
  type PendingAiReply,
} from "@/features/calls/live/callStore";

const at = 1_700_000_000_000;
const idGen = (label: string) => {
  let n = 0;
  return () => `${label}-${++n}`;
};

const realBubble: Bubble = {
  id: "real-1",
  role: "interlocutor",
  content: "previous final",
  partial: false,
  ts: at - 1,
};

describe("interlocutor turn aggregation", () => {
  it("first partial opens a new live bubble + turn", () => {
    const { bubbles, turn } = withInterlocutorPartial([], null, "привіт", at, idGen("t"));
    expect(bubbles).toHaveLength(1);
    expect(bubbles[0]).toMatchObject({ id: "t-1", content: "привіт", partial: true });
    expect(turn).toEqual({ id: "t-1", committed: "", lastTs: at });
  });

  it("a final within the merge gap appends to the SAME bubble (micro-pause)", () => {
    const first = withInterlocutorFinal([], null, "я хотів", at, () => "msg-1");
    // a tiny pause, then the next finalised segment of the same sentence
    const second = withInterlocutorFinal(
      first.bubbles,
      first.turn,
      "записатися",
      at + 500,
      () => "msg-2",
    );
    expect(second.bubbles).toHaveLength(1);
    expect(second.bubbles[0]).toMatchObject({
      id: "msg-1",
      content: "я хотів записатися",
      partial: true,
    });
    expect(second.turn).toEqual({ id: "msg-1", committed: "я хотів записатися", lastTs: at + 500 });
  });

  it("a final after a real silence starts a NEW bubble", () => {
    const first = withInterlocutorFinal([], null, "перше речення", at, () => "msg-1");
    const second = withInterlocutorFinal(
      first.bubbles,
      first.turn,
      "інша думка",
      at + INTERLOCUTOR_MERGE_GAP_MS + 1,
      () => "msg-2",
    );
    expect(second.bubbles).toHaveLength(2);
    expect(second.bubbles[1]).toMatchObject({ id: "msg-2", content: "інша думка" });
  });

  it("a live partial grows on top of the committed text without losing it", () => {
    const f = withInterlocutorFinal([], null, "я хотів", at, () => "msg-1");
    const p = withInterlocutorPartial(f.bubbles, f.turn, "запис", at + 300, idGen("t"));
    expect(p.bubbles[0]).toMatchObject({ id: "msg-1", content: "я хотів запис", partial: true });
  });

  it("sealInterlocutorTurn marks the active bubble final", () => {
    const f = withInterlocutorFinal([], null, "готово", at, () => "msg-1");
    const sealed = sealInterlocutorTurn(f.bubbles, f.turn);
    expect(sealed[0]).toMatchObject({ id: "msg-1", partial: false });
    expect(sealInterlocutorTurn(f.bubbles, null)).toBe(f.bubbles);
  });
});

describe("ai bubble reducers", () => {
  it("withAiPartial replaces only the AI partial — interlocutor partials are preserved", () => {
    const old: Bubble[] = [
      {
        id: "turn-7",
        role: "interlocutor",
        content: "співрозм",
        partial: true,
        ts: at - 1,
      },
      {
        id: PARTIAL_AI_ID,
        role: "ai",
        content: "ai стара",
        partial: true,
        ts: at - 2,
      },
    ];
    const out = withAiPartial(old, "ai нова", at);
    expect(out.find((b) => b.id === "turn-7")).toBeDefined();
    const aiBubble = out.find((b) => b.id === PARTIAL_AI_ID);
    expect(aiBubble?.content).toBe("ai нова");
    expect(aiBubble?.ts).toBe(at);
  });

  it("withAiFinal commits and accepts an optional bubble kind", () => {
    const out = withAiFinal([], "ai-1", "Алло?", at, "idle_probe");
    expect(out[0]).toEqual({
      id: "ai-1",
      role: "ai",
      content: "Алло?",
      partial: false,
      ts: at,
      kind: "idle_probe",
    });
  });

  it("withAiFinal defaults kind to normal when omitted", () => {
    const out = withAiFinal([], "ai-1", "Привіт", at);
    expect(out[0]?.kind).toBe("normal");
  });
});

describe("user and system bubble reducers", () => {
  it("withUserTyped appends with the given id", () => {
    const out = withUserTyped([realBubble], "u-1", "hi", at);
    expect(out.at(-1)).toEqual({
      id: "u-1",
      role: "user",
      content: "hi",
      partial: false,
      ts: at,
    });
  });

  it("withSystem appends with role=system", () => {
    const out = withSystem([], "s-1", "AGENT_LOST", at);
    expect(out[0]?.role).toBe("system");
  });
});

describe("nextStatusState", () => {
  it("stamps connectStartedAt the first time we enter connecting", () => {
    expect(nextStatusState("idle", null, "connecting", at)).toEqual({
      status: "connecting",
      connectStartedAt: at,
    });
  });

  it("keeps the existing connectStartedAt across connecting → ringing", () => {
    expect(nextStatusState("connecting", at - 1, "ringing", at)).toEqual({
      status: "ringing",
      connectStartedAt: at - 1,
    });
  });

  it("clears connectStartedAt on active", () => {
    expect(nextStatusState("ringing", at - 1, "active", at)).toEqual({
      status: "active",
      connectStartedAt: null,
    });
  });

  it("clears connectStartedAt on ended", () => {
    expect(nextStatusState("active", null, "ended", at)).toEqual({
      status: "ended",
      connectStartedAt: null,
    });
  });

  it("does not re-stamp connectStartedAt on a second connecting", () => {
    expect(nextStatusState("connecting", at - 1, "connecting", at)).toEqual({
      status: "connecting",
      connectStartedAt: at - 1,
    });
  });

  it("preserves connectStartedAt on reconnecting", () => {
    expect(nextStatusState("ringing", at - 1, "reconnecting", at)).toEqual({
      status: "reconnecting",
      connectStartedAt: at - 1,
    });
  });
});

describe("pendingAiReplyChange", () => {
  const reply: PendingAiReply = {
    candidateId: "c-1",
    text: "Привіт",
    autoAcceptInMs: 5000,
    receivedAt: at,
    streaming: false,
  };

  it("non-null reply clears aiThinking", () => {
    expect(pendingAiReplyChange(reply)).toEqual({
      pendingAiReply: reply,
      aiThinking: false,
    });
  });

  it("null reply does NOT touch aiThinking (preserves whatever it was)", () => {
    expect(pendingAiReplyChange(null)).toEqual({ pendingAiReply: null });
  });
});

describe("pushUserTyped clears the pending AI candidate", () => {
  it("drops pendingAiReply when the user speaks their own reply (no double-speak card)", () => {
    useCallStore.getState().setPendingAiReply({
      candidateId: "c-1",
      text: "AI suggested line",
      autoAcceptInMs: 5000,
      receivedAt: at,
      streaming: false,
    });
    expect(useCallStore.getState().pendingAiReply).not.toBeNull();

    useCallStore.getState().pushUserTyped("my own reply");

    expect(useCallStore.getState().pendingAiReply).toBeNull();
  });
});
