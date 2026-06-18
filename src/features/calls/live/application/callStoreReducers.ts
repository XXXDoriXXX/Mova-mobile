import type {
  Bubble,
  CallStatus,
  InterlocutorTurn,
  PendingAiReply,
} from "../callStore";

export const PARTIAL_AI_ID = "__partial_ai__";

// A speaker's micro-pauses make the backend STT emit several `transcript.final`
// segments for one sentence. Merge them into a single growing bubble while the
// gap between segments stays short; only a real silence (or the other party
// starting to speak) ends the turn and starts a fresh bubble. Kept ≥ the
// backend's TURN_DEBOUNCE_MS so the client never splits what the agent treats
// as one turn, and re-merges a backend over-split if speech resumes quickly.
export const INTERLOCUTOR_MERGE_GAP_MS = 3000;

function joinText(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

export type InterlocutorUpdate = { bubbles: Bubble[]; turn: InterlocutorTurn };

function isTurnLive(turn: InterlocutorTurn, ts: number): turn is NonNullable<InterlocutorTurn> {
  return turn !== null && ts - turn.lastTs <= INTERLOCUTOR_MERGE_GAP_MS;
}

// Live (interim) STT — shows committed text of the turn so far plus the
// in-progress words, in one bubble that keeps the same id as it grows.
export function withInterlocutorPartial(
  bubbles: Bubble[],
  turn: InterlocutorTurn,
  text: string,
  ts: number,
  newId: () => string,
): InterlocutorUpdate {
  const live = isTurnLive(turn, ts);
  const id = live ? turn.id : newId();
  const committed = live ? turn.committed : "";
  const others = bubbles.filter((b) => b.id !== id);
  return {
    bubbles: [
      ...others,
      { id, role: "interlocutor", content: joinText(committed, text), partial: true, ts },
    ],
    turn: { id, committed, lastTs: ts },
  };
}

// Finalised STT segment — appends to the turn's committed text. The bubble stays
// `partial: true` (the turn may still grow); `sealInterlocutorTurn` flips it to
// final on a real silence or when the other party starts speaking.
export function withInterlocutorFinal(
  bubbles: Bubble[],
  turn: InterlocutorTurn,
  text: string,
  ts: number,
  newId: () => string,
): InterlocutorUpdate {
  const live = isTurnLive(turn, ts);
  const id = live ? turn.id : newId();
  const committed = joinText(live ? turn.committed : "", text);
  const others = bubbles.filter((b) => b.id !== id);
  return {
    bubbles: [
      ...others,
      { id, role: "interlocutor", content: committed, partial: true, ts },
    ],
    turn: { id, committed, lastTs: ts },
  };
}

// End the active interlocutor turn: stop the "speaking" state on its bubble.
export function sealInterlocutorTurn(bubbles: Bubble[], turn: InterlocutorTurn): Bubble[] {
  if (!turn) return bubbles;
  return bubbles.map((b) => (b.id === turn.id ? { ...b, partial: false } : b));
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
