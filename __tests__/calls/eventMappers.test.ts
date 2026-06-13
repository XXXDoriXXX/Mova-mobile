import {
  computeNextCandidate,
  mapAiTextFinalKind,
  resolveCallError,
  shouldAutoPromoteToActive,
} from "@/features/calls/live/application/eventMappers";
import { CallErrorCode } from "@/realtime/error-codes";
import type { PendingAiReply } from "@/features/calls/live/callStore";

describe("mapAiTextFinalKind", () => {
  it.each([
    ["idle_probe", "idle_probe"],
    ["fallback", "fallback"],
    ["openai", "normal"],
    ["", "normal"],
    [null, "normal"],
    [undefined, "normal"],
  ] as const)("provider=%s → %s", (provider, expected) => {
    expect(mapAiTextFinalKind(provider)).toBe(expected);
  });
});

describe("computeNextCandidate", () => {
  const now = 1_700_000_000_000;

  const streamingChunk = {
    candidateId: "c-1",
    text: "Привіт",
    autoAcceptInMs: null,
    streaming: true,
  };

  const finalChunk = {
    candidateId: "c-1",
    text: "Привіт, я Mova.",
    autoAcceptInMs: 5000,
    streaming: false,
  };

  it("first chunk for a brand new candidate stamps receivedAt=now and flags isNewCandidate", () => {
    const { next, isNewCandidate } = computeNextCandidate(null, streamingChunk, now);
    expect(next.candidateId).toBe("c-1");
    expect(next.streaming).toBe(true);
    expect(next.receivedAt).toBe(now);
    expect(isNewCandidate).toBe(true);
  });

  it("streaming follow-up for the same candidate preserves the original receivedAt", () => {
    const prev: PendingAiReply = {
      candidateId: "c-1",
      text: "Прив",
      autoAcceptInMs: null,
      receivedAt: now - 500,
      streaming: true,
    };
    const { next, isNewCandidate } = computeNextCandidate(prev, streamingChunk, now);
    expect(next.receivedAt).toBe(now - 500);
    expect(isNewCandidate).toBe(false);
  });

  it("finalize after streaming stamps a fresh receivedAt for the countdown", () => {
    const prev: PendingAiReply = {
      candidateId: "c-1",
      text: "Прив",
      autoAcceptInMs: null,
      receivedAt: now - 1500,
      streaming: true,
    };
    const { next, isNewCandidate } = computeNextCandidate(prev, finalChunk, now);
    expect(next.streaming).toBe(false);
    expect(next.autoAcceptInMs).toBe(5000);
    expect(next.receivedAt).toBe(now);
    expect(isNewCandidate).toBe(false);
  });

  it("brand new finalized candidate (no streaming chunks first) stamps now and is flagged new", () => {
    const { next, isNewCandidate } = computeNextCandidate(null, finalChunk, now);
    expect(next.receivedAt).toBe(now);
    expect(isNewCandidate).toBe(true);
  });

  it("a different candidateId resets receivedAt and flags new", () => {
    const prev: PendingAiReply = {
      candidateId: "c-OLD",
      text: "стара",
      autoAcceptInMs: 5000,
      receivedAt: now - 9999,
      streaming: false,
    };
    const { next, isNewCandidate } = computeNextCandidate(
      prev,
      { ...streamingChunk, candidateId: "c-NEW" },
      now,
    );
    expect(next.candidateId).toBe("c-NEW");
    expect(next.receivedAt).toBe(now);
    expect(isNewCandidate).toBe(true);
  });
});

describe("resolveCallError", () => {
  it("honours an explicit recoverable=true override", () => {
    expect(
      resolveCallError({
        code: CallErrorCode.STT_UNAVAILABLE,
        message: "x",
        recoverable: true,
      }).recoverable,
    ).toBe(true);
  });

  it("honours an explicit recoverable=false override", () => {
    expect(
      resolveCallError({
        code: CallErrorCode.STT_DEGRADED,
        message: "x",
        recoverable: false,
      }).recoverable,
    ).toBe(false);
  });

  it("falls back to the code's default recoverability when omitted", () => {
    const degraded = resolveCallError({
      code: CallErrorCode.STT_DEGRADED,
      message: "x",
    });
    expect(typeof degraded.recoverable).toBe("boolean");
  });
});

describe("shouldAutoPromoteToActive", () => {
  it("returns false outside the connecting/ringing window", () => {
    expect(shouldAutoPromoteToActive("idle", "transcript.partial")).toBe(false);
    expect(shouldAutoPromoteToActive("active", "transcript.partial")).toBe(false);
    expect(shouldAutoPromoteToActive("ended", "transcript.partial")).toBe(false);
    expect(shouldAutoPromoteToActive("reconnecting", "transcript.partial")).toBe(false);
  });

  it("promotes on a real interlocutor transcript (the only proof they answered)", () => {
    expect(shouldAutoPromoteToActive("connecting", "transcript.final")).toBe(true);
    expect(shouldAutoPromoteToActive("ringing", "transcript.partial")).toBe(true);
  });

  it("does NOT promote on the agent's own activity while ringing (the bug)", () => {
    // The greeting, suggestions, ticks and config echoes all fire while the SIP
    // leg is still ringing — none of them mean the other side picked up, so the
    // UI must stay on the ringing screen.
    expect(shouldAutoPromoteToActive("ringing", "ai.text.final")).toBe(false);
    expect(shouldAutoPromoteToActive("ringing", "ai.thinking")).toBe(false);
    expect(shouldAutoPromoteToActive("ringing", "ai.text.candidate")).toBe(false);
    expect(shouldAutoPromoteToActive("ringing", "suggestions.new")).toBe(false);
    expect(shouldAutoPromoteToActive("ringing", "usage.tick")).toBe(false);
    expect(shouldAutoPromoteToActive("ringing", "call.config.changed")).toBe(false);
  });

  it("never promotes on a liveness-irrelevant event", () => {
    expect(shouldAutoPromoteToActive("connecting", "call.connected")).toBe(false);
    expect(shouldAutoPromoteToActive("connecting", "call.answered")).toBe(false);
    expect(shouldAutoPromoteToActive("connecting", "call.ended")).toBe(false);
    expect(shouldAutoPromoteToActive("connecting", "pong")).toBe(false);
  });
});
