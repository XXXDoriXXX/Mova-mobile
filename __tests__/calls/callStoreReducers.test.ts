import {
  nextStatusState,
  PARTIAL_AI_ID,
  PARTIAL_INTERLOCUTOR_ID,
  pendingAiReplyChange,
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

const realBubble: Bubble = {
  id: "real-1",
  role: "interlocutor",
  content: "previous final",
  partial: false,
  ts: at - 1,
};

describe("interlocutor bubble reducers", () => {
  it("withInterlocutorPartial replaces any prior partial, keeps real bubbles", () => {
    const old: Bubble[] = [
      realBubble,
      {
        id: PARTIAL_INTERLOCUTOR_ID,
        role: "interlocutor",
        content: "old partial",
        partial: true,
        ts: at - 2,
      },
    ];
    const out = withInterlocutorPartial(old, "новий партіал", at);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual(realBubble);
    expect(out[1]).toEqual({
      id: PARTIAL_INTERLOCUTOR_ID,
      role: "interlocutor",
      content: "новий партіал",
      partial: true,
      ts: at,
    });
  });

  it("withInterlocutorFinal removes the partial, appends the final with the given id", () => {
    const old: Bubble[] = [
      realBubble,
      {
        id: PARTIAL_INTERLOCUTOR_ID,
        role: "interlocutor",
        content: "growing",
        partial: true,
        ts: at - 1,
      },
    ];
    const out = withInterlocutorFinal(old, "msg-1", "фінал", at);
    expect(out.find((b) => b.id === PARTIAL_INTERLOCUTOR_ID)).toBeUndefined();
    expect(out.at(-1)).toEqual({
      id: "msg-1",
      role: "interlocutor",
      content: "фінал",
      partial: false,
      ts: at,
    });
  });
});

describe("ai bubble reducers", () => {
  it("withAiPartial replaces only the AI partial — interlocutor partials are preserved", () => {
    const old: Bubble[] = [
      {
        id: PARTIAL_INTERLOCUTOR_ID,
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
    expect(out.find((b) => b.id === PARTIAL_INTERLOCUTOR_ID)).toBeDefined();
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
