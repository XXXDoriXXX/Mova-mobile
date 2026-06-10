import type { Conversation } from "@/types/api";

import { formatPhoneForDisplay } from "./phone";

const ONLINE_CALL_LABEL = "Онлайн-дзвінок";

export function isPeerCall(c: Pick<Conversation, "callType">): boolean {
  return c.callType === "peer_inbound";
}

export function conversationTitle(
  c: Pick<Conversation, "callType" | "caller" | "targetPhone">,
): string {
  if (isPeerCall(c)) {
    return c.caller?.name ?? ONLINE_CALL_LABEL;
  }
  return formatPhoneForDisplay(c.targetPhone) || ONLINE_CALL_LABEL;
}

export function conversationSubtitle(
  c: Pick<Conversation, "callType" | "caller" | "targetPhone">,
): string | null {
  return isPeerCall(c) ? ONLINE_CALL_LABEL : null;
}
