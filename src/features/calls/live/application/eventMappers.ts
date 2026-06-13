import type { CallErrorCode } from "@/realtime/error-codes";
import { isRecoverable } from "@/realtime/error-codes";

import type { Bubble, CallError, CallStatus, PendingAiReply } from "../callStore";

export type AiTextFinalKind = NonNullable<Bubble["kind"]>;

export function mapAiTextFinalKind(provider: string | null | undefined): AiTextFinalKind {
  if (provider === "idle_probe") return "idle_probe";
  if (provider === "fallback") return "fallback";
  return "normal";
}

export type CandidateChunk = {
  candidateId: string;
  text: string;
  autoAcceptInMs: number | null;
  streaming: boolean;
};

export type NextCandidate = {
  next: PendingAiReply;
  isNewCandidate: boolean;
};

export function computeNextCandidate(
  prev: PendingAiReply | null,
  chunk: CandidateChunk,
  now: number,
): NextCandidate {
  const sameCandidate = prev?.candidateId === chunk.candidateId;
  const justFinalized = !chunk.streaming && (!sameCandidate || !!prev?.streaming);
  const receivedAt = justFinalized
    ? now
    : sameCandidate
      ? prev!.receivedAt
      : now;
  return {
    next: {
      candidateId: chunk.candidateId,
      text: chunk.text,
      autoAcceptInMs: chunk.autoAcceptInMs,
      streaming: chunk.streaming,
      receivedAt,
    },
    isNewCandidate: !sameCandidate,
  };
}

export type CallErrorInput = {
  code: CallErrorCode;
  message: string;
  recoverable?: boolean;
};

export function resolveCallError(input: CallErrorInput): CallError {
  return {
    code: input.code,
    message: input.message,
    recoverable: input.recoverable ?? isRecoverable(input.code),
  };
}

/**
 * Events that prove the INTERLOCUTOR is actually on the line — only these may
 * flip a ringing call to "active". The agent's own greeting (`ai.text.*`),
 * provider/config echoes (`call.config.changed`), and billing ticks
 * (`usage.tick`) all fire while the SIP leg is merely RINGING, so promoting on
 * them showed the in-call screen before anyone picked up. `call.answered` is
 * the authoritative answer signal (handled explicitly in routeEvent); a
 * transcript is the safety net for the race where the interlocutor speaks a
 * fraction before that event lands.
 */
const INTERLOCUTOR_PRESENT_EVENTS = new Set<string>([
  "transcript.partial",
  "transcript.final",
]);

export function shouldAutoPromoteToActive(
  currentStatus: CallStatus,
  eventType: string,
): boolean {
  if (currentStatus !== "connecting" && currentStatus !== "ringing") return false;
  return INTERLOCUTOR_PRESENT_EVENTS.has(eventType);
}
