// Discriminated union of WebSocket commands the mobile client can send
// during an active call. See docs/06-websocket-protocol.md.

export type ClientCommand =
  | { type: "user.speak"; data: { text: string } }
  | { type: "user.accept_suggestion"; data: { suggestionId: string } }
  | { type: "user.stop_tts"; data: { messageId?: string } }
  | { type: "user.change_style"; data: { styleId: string } }
  | { type: "user.change_voice"; data: { voice: string } }
  | {
      type: "user.change_model";
      data: {
        providerType: "llm" | "tts" | "stt";
        provider: string;
        model?: string;
      };
    }
  | { type: "user.end_call"; data: Record<string, never> }
  | { type: "ping"; data: { sentAt: number } };

export type ClientCommandType = ClientCommand["type"];
