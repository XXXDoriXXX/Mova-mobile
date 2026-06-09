import { useMemo } from "react";

import type { ClientCommand } from "@/realtime/protocol";

export type CallControls = {
  speak: (text: string) => void;
  acceptSuggestion: (suggestionId: string) => void;
  acceptAiReply: (candidateId: string) => void;
  cancelAiReply: (candidateId: string) => void;
  endCall: () => void;
  setAutoMode: (enabled: boolean) => void;
  changeStyle: (styleId: string) => void;
  changeVoice: (voice: string) => void;
};

export function useCallControls(send: (cmd: ClientCommand) => void): CallControls {
  return useMemo<CallControls>(
    () => ({
      speak: (text) => send({ type: "user.speak", data: { text } }),
      acceptSuggestion: (suggestionId) =>
        send({ type: "user.accept_suggestion", data: { suggestionId } }),
      acceptAiReply: (candidateId) =>
        send({ type: "user.accept_ai_reply", data: { candidateId } }),
      cancelAiReply: (candidateId) =>
        send({ type: "user.cancel_ai_reply", data: { candidateId } }),
      endCall: () => send({ type: "user.end_call" }),
      setAutoMode: (enabled) =>
        send({ type: "user.set_auto_mode", data: { enabled } }),
      changeStyle: (styleId) =>
        send({ type: "user.change_style", data: { styleId } }),
      changeVoice: (voice) =>
        send({ type: "user.change_voice", data: { voice } }),
    }),
    [send],
  );
}
