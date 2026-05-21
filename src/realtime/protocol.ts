import { z } from "zod";

import { CallErrorCode } from "./error-codes";

/**
 * WebSocket protocol — Zod schemas mirrored from
 * `libs/shared-realtime/src/lib/ws-events.ts` in the MOVA backend monorepo.
 * Kept verbatim so the mobile client validates the exact same payload shapes
 * the server emits. When the backend protocol changes, sync this file.
 *
 * Wire format: JSON envelopes with a `type` discriminator. Server events
 * include `id` and `timestamp`. Client commands are flat payloads.
 */
export const WS_PROTOCOL_VERSION = "1" as const;

// ─────────────────────────────────────────────────────
// Envelope (every server event)
// ─────────────────────────────────────────────────────

const envelope = z.object({
  /**
   * Opaque event id — used by us as `lastStreamId` on reconnect. Producer-
   * defined format: Redis Stream entries are `<ms>-<seq>`, synthetic events
   * are UUIDs, gateway-local events are socket.id. Treat as opaque.
   */
  id: z.string().min(1),
  /** ISO 8601 timestamp (UTC) of when the event was produced server-side. */
  timestamp: z.string().datetime(),
});

// ─────────────────────────────────────────────────────
// Server → Client events
// ─────────────────────────────────────────────────────

export const ServerEvent = {
  callConnected: envelope.extend({
    type: z.literal("call.connected"),
    data: z.object({
      conversationId: z.string().uuid(),
    }),
  }),

  /** Partial STT result. May arrive multiple times before a final. */
  transcriptPartial: envelope.extend({
    type: z.literal("transcript.partial"),
    data: z.object({ text: z.string() }),
  }),

  /** Finalized STT for one utterance of the interlocutor. */
  transcriptFinal: envelope.extend({
    type: z.literal("transcript.final"),
    data: z.object({
      // Opaque: producer currently sends the stream-id (`<ms>-<seq>`), not
      // a UUID. Constraining to UUID dropped every transcript event.
      messageId: z.string().min(1),
      text: z.string(),
    }),
  }),

  /** LLM started generating a reply — empty data; presence is the signal. */
  aiThinking: envelope.extend({
    type: z.literal("ai.thinking"),
    data: z.object({}),
  }),

  aiTextPartial: envelope.extend({
    type: z.literal("ai.text.partial"),
    data: z.object({ text: z.string() }),
  }),

  aiTextFinal: envelope.extend({
    type: z.literal("ai.text.final"),
    data: z.object({
      messageId: z.string().min(1),
      text: z.string(),
      source: z.object({
        provider: z.string(),
        model: z.string(),
      }),
    }),
  }),

  aiTtsStart: envelope.extend({
    type: z.literal("ai.tts.start"),
    data: z.object({
      messageId: z.string().min(1),
      voice: z.string(),
    }),
  }),

  aiTtsEnd: envelope.extend({
    type: z.literal("ai.tts.end"),
    data: z.object({
      messageId: z.string().min(1),
      status: z.enum(["completed", "interrupted", "failed"]),
    }),
  }),

  suggestionsNew: envelope.extend({
    type: z.literal("suggestions.new"),
    data: z.object({
      parentMessageId: z.string().min(1),
      items: z
        .array(
          z.object({
            id: z.string().min(1),
            text: z.string().min(1).max(120),
          }),
        )
        .length(3),
    }),
  }),

  /** Periodic billing tick — sent ~every 5s during an active call. */
  usageTick: envelope.extend({
    type: z.literal("usage.tick"),
    data: z.object({
      secondsElapsed: z.number().int().nonnegative(),
      /** null for paid plans (balance-based, not quota-based). */
      secondsRemaining: z.number().int().nonnegative().nullable(),
      planCode: z.enum(["free", "paid"]),
    }),
  }),

  callConfigChanged: envelope.extend({
    type: z.literal("call.config.changed"),
    data: z.object({
      providerType: z.enum(["stt", "llm", "tts"]).optional(),
      provider: z.string().optional(),
      model: z.string().optional(),
      voice: z.string().optional(),
      styleId: z.string().optional(),
    }),
  }),

  callError: envelope.extend({
    type: z.literal("call.error"),
    data: z.object({
      code: z.nativeEnum(CallErrorCode),
      message: z.string(),
      recoverable: z.boolean(),
    }),
  }),

  /** Terminal event — server closes the WS shortly after. */
  callEnded: envelope.extend({
    type: z.literal("call.ended"),
    data: z.object({
      reason: z.enum([
        "user",
        "interlocutor",
        "balance",
        "fatal_error",
        "timeout",
        "admin",
      ]),
      durationSeconds: z.number().int().nonnegative(),
      endedBy: z.enum(["user", "system", "interlocutor", "admin"]),
    }),
  }),

  pong: envelope.extend({
    type: z.literal("pong"),
  }),
} as const;

/** Discriminated union of every server event. */
export const ServerEventSchema = z.discriminatedUnion("type", [
  ServerEvent.callConnected,
  ServerEvent.transcriptPartial,
  ServerEvent.transcriptFinal,
  ServerEvent.aiThinking,
  ServerEvent.aiTextPartial,
  ServerEvent.aiTextFinal,
  ServerEvent.aiTtsStart,
  ServerEvent.aiTtsEnd,
  ServerEvent.suggestionsNew,
  ServerEvent.usageTick,
  ServerEvent.callConfigChanged,
  ServerEvent.callError,
  ServerEvent.callEnded,
  ServerEvent.pong,
]);

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ServerEvent = z.infer<typeof ServerEventSchema>;
export type ServerEventType = ServerEvent["type"];

// ─────────────────────────────────────────────────────
// Client → Server commands
// ─────────────────────────────────────────────────────

export const ClientCommand = {
  speak: z.object({
    type: z.literal("user.speak"),
    data: z.object({ text: z.string().min(1).max(2000) }),
  }),

  acceptSuggestion: z.object({
    type: z.literal("user.accept_suggestion"),
    data: z.object({ suggestionId: z.string().uuid() }),
  }),

  stopTts: z.object({
    type: z.literal("user.stop_tts"),
  }),

  changeVoice: z.object({
    type: z.literal("user.change_voice"),
    data: z.object({ voice: z.string().min(1) }),
  }),

  changeModel: z.object({
    type: z.literal("user.change_model"),
    data: z.object({
      providerType: z.enum(["stt", "llm", "tts"]),
      provider: z.string().min(1),
      model: z.string().optional(),
    }),
  }),

  changeStyle: z.object({
    type: z.literal("user.change_style"),
    data: z.object({ styleId: z.string().min(1).max(80) }),
  }),

  endCall: z.object({
    type: z.literal("user.end_call"),
  }),

  ping: z.object({
    type: z.literal("ping"),
  }),
} as const;

export const ClientCommandSchema = z.discriminatedUnion("type", [
  ClientCommand.speak,
  ClientCommand.acceptSuggestion,
  ClientCommand.stopTts,
  ClientCommand.changeVoice,
  ClientCommand.changeModel,
  ClientCommand.changeStyle,
  ClientCommand.endCall,
  ClientCommand.ping,
]);

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ClientCommand = z.infer<typeof ClientCommandSchema>;
export type ClientCommandType = ClientCommand["type"];

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

/** Parse a raw server event. Returns null on invalid shape — never throws. */
export function parseServerEvent(raw: unknown): ServerEvent | null {
  const result = ServerEventSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/** Parse a raw client command. Returns null on invalid shape. */
export function parseClientCommand(raw: unknown): ClientCommand | null {
  const result = ClientCommandSchema.safeParse(raw);
  return result.success ? result.data : null;
}
