import { useState } from "react";
import { router } from "expo-router";

import { startPeerCall } from "@/api/calls";
import { extractErrorPayload } from "@/api/client";

import { useCallSignalStore } from "../../incoming/callSignalStore";
import { getCallMediaTransport } from "./callMediaTransport";

export type StartPeerCallTarget = {
  calleeUserId: string;
  calleeName: string;
  templateId?: string;
};

export function useStartPeerCall() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(target: StartPeerCallTarget): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const res = await startPeerCall({
        calleeUserId: target.calleeUserId,
        templateId: target.templateId,
      });
      const transport = getCallMediaTransport();
      if (transport.isAvailable()) {
        await transport.connect({
          url: res.livekitUrl,
          token: res.livekitToken,
        });
      }
      useCallSignalStore.getState().setOutgoing({
        conversationId: res.conversationId,
        calleeName: target.calleeName,
        status: "ringing",
      });
      router.push({
        pathname: "/call/outgoing",
        params: { conversationId: res.conversationId },
      });
    } catch (err) {
      const payload = extractErrorPayload(err);
      const code = (payload as { code?: string } | undefined)?.code;
      setError(code ?? "CALL_FAILED");
    } finally {
      setSubmitting(false);
    }
  }

  return { call, submitting, error };
}
