import type { Conversation } from "@/types/api";

import { formatPhoneForDisplay } from "./phone";

const ONLINE_CALL_LABEL = "Онлайн-дзвінок";

export function isPeerCall(c: Pick<Conversation, "callType">): boolean {
  return c.callType === "peer_inbound";
}

export function conversationTitle(
  c: Pick<Conversation, "callType" | "caller" | "targetPhone">,
): string {
  return callTitleFrom({
    callType: c.callType,
    callerName: c.caller?.name ?? null,
    targetPhone: c.targetPhone,
  });
}

// Same title rule but from flat fields (e.g. a search hit, which carries
// callerName as a plain string rather than a nested caller object).
export function callTitleFrom(opts: {
  callType: Conversation["callType"];
  callerName?: string | null;
  targetPhone?: string | null;
}): string {
  if (opts.callType === "peer_inbound") {
    return opts.callerName ?? ONLINE_CALL_LABEL;
  }
  return formatPhoneForDisplay(opts.targetPhone ?? null) || ONLINE_CALL_LABEL;
}

export function conversationSubtitle(
  c: Pick<Conversation, "callType" | "caller" | "targetPhone">,
): string | null {
  return isPeerCall(c) ? ONLINE_CALL_LABEL : null;
}
