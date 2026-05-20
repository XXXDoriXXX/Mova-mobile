import type { CallErrorCode } from "./error-codes";

// Discriminated union of server-emitted WebSocket events per
// docs/06-websocket-protocol.md. Each event arrives in the envelope below.

type Envelope<TType extends string, TData> = {
  type: TType;
  id: string;
  timestamp: string;
  data: TData;
};

export type ServerEvent =
  | Envelope<"call.connected", { conversationId: string; connectedAt: string }>
  | Envelope<"call.ended", { endReason: string; durationSeconds: number }>
  | Envelope<"transcript.partial", { content: string }>
  | Envelope<
      "transcript.final",
      { messageId: string; content: string; createdAt: string }
    >
  | Envelope<"ai.thinking", { active: boolean }>
  | Envelope<"ai.text.partial", { content: string }>
  | Envelope<
      "ai.text.final",
      { messageId: string; content: string; createdAt: string }
    >
  | Envelope<"ai.tts.start", { messageId: string }>
  | Envelope<
      "ai.tts.end",
      { messageId: string; status: "completed" | "interrupted" | "failed" }
    >
  | Envelope<
      "suggestions.new",
      {
        parentMessageId: string;
        items: { id: string; content: string }[];
      }
    >
  | Envelope<
      "usage.tick",
      {
        secondsElapsed: number;
        balanceCents?: number;
        freeSecondsRemaining?: number;
      }
    >
  | Envelope<
      "call.config.changed",
      {
        styleId?: string;
        voice?: string;
        llmProvider?: string;
        llmModel?: string;
        ttsProvider?: string;
      }
    >
  | Envelope<
      "call.error",
      {
        code: CallErrorCode;
        message: string;
        recoverable: boolean;
      }
    >;

export type ServerEventType = ServerEvent["type"];
