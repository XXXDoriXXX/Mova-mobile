import { useState } from "react";
import { router } from "expo-router";

import { cancelPeerCall, startPeerCall } from "@/api/calls";
import { extractErrorPayload } from "@/api/client";
import { callLog, callError } from "@/observability/callLog";

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
    const transport = getCallMediaTransport();
    callLog("call.peer.startRequested", {
      calleeUserId: target.calleeUserId,
      mediaAvailable: transport.isAvailable(),
    });
    if (!transport.isAvailable()) {
      callLog("call.peer.startBlocked", { reason: "MEDIA_UNAVAILABLE" });
      setError("MEDIA_UNAVAILABLE");
      return;
    }

    setSubmitting(true);
    setError(null);
    let conversationId: string | null = null;
    try {
      const res = await startPeerCall({
        calleeUserId: target.calleeUserId,
        templateId: target.templateId,
      });
      conversationId = res.conversationId;
      callLog("call.peer.created", { conversationId, roomName: res.roomName });
      await transport.connect({ url: res.livekitUrl, token: res.livekitToken });
      callLog("call.peer.mediaConnected", { conversationId });
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
      if (conversationId) {
        await cancelPeerCall(conversationId).catch(() => undefined);
        await transport.disconnect().catch(() => undefined);
      }
      const payload = extractErrorPayload(err);
      const code = (payload as { code?: string } | undefined)?.code;
      callError("call.peer.startFailed", err, { conversationId, code });
      setError(code ?? "CALL_FAILED");
    } finally {
      setSubmitting(false);
    }
  }

  return { call, submitting, error };
}
