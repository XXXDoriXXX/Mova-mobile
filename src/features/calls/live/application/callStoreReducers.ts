import type { Bubble, CallStatus, PendingAiReply } from "../callStore";

export const PARTIAL_INTERLOCUTOR_ID = "__partial_interlocutor__";
export const PARTIAL_AI_ID = "__partial_ai__";

export function withInterlocutorPartial(bubbles: Bubble[], text: string, ts: number): Bubble[] {
  const others = bubbles.filter((b) => b.id !== PARTIAL_INTERLOCUTOR_ID);
  return [
    ...others,
    {
      id: PARTIAL_INTERLOCUTOR_ID,
      role: "interlocutor",
      content: text,
      partial: true,
      ts,
    },
  ];
}

export function withInterlocutorFinal(
  bubbles: Bubble[],
  messageId: string,
  text: string,
  ts: number,
): Bubble[] {
  const others = bubbles.filter((b) => b.id !== PARTIAL_INTERLOCUTOR_ID);
  return [
    ...others,
    {
      id: messageId,
      role: "interlocutor",
      content: text,
      partial: false,
      ts,
    },
  ];
}

export function withAiPartial(bubbles: Bubble[], text: string, ts: number): Bubble[] {
  const others = bubbles.filter((b) => b.id !== PARTIAL_AI_ID);
  return [
    ...others,
    {
      id: PARTIAL_AI_ID,
      role: "ai",
      content: text,
      partial: true,
      ts,
    },
  ];
}

export function withAiFinal(
  bubbles: Bubble[],
  messageId: string,
  text: string,
  ts: number,
  kind: Bubble["kind"] = "normal",
): Bubble[] {
  const others = bubbles.filter((b) => b.id !== PARTIAL_AI_ID);
  return [
    ...others,
    {
      id: messageId,
      role: "ai",
      content: text,
      partial: false,
      ts,
      kind,
    },
  ];
}

export function withUserTyped(bubbles: Bubble[], id: string, content: string, ts: number): Bubble[] {
  return [
    ...bubbles,
    { id, role: "user", content, partial: false, ts },
  ];
}

export function withSystem(bubbles: Bubble[], id: string, content: string, ts: number): Bubble[] {
  return [
    ...bubbles,
    { id, role: "system", content, partial: false, ts },
  ];
}

export type StatusTransition = {
  status: CallStatus;
  connectStartedAt: number | null;
};

export function nextStatusState(
  prevStatus: CallStatus,
  prevConnectStartedAt: number | null,
  nextStatus: CallStatus,
  now: number,
): StatusTransition {
  if (
    (nextStatus === "connecting" || nextStatus === "ringing") &&
    prevConnectStartedAt === null
  ) {
    return { status: nextStatus, connectStartedAt: now };
  }
  if (nextStatus === "active" || nextStatus === "ended") {
    return { status: nextStatus, connectStartedAt: null };
  }
  return { status: nextStatus, connectStartedAt: prevConnectStartedAt };
}

export type PendingAiReplyChange = {
  pendingAiReply: PendingAiReply | null;
  aiThinking?: boolean;
};

export function pendingAiReplyChange(reply: PendingAiReply | null): PendingAiReplyChange {
  return reply ? { pendingAiReply: reply, aiThinking: false } : { pendingAiReply: reply };
}
