import { z } from "zod";

const signalEnvelope = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
});

const callerSummary = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

export const SignalEventSchema = z.discriminatedUnion("type", [
  signalEnvelope.extend({
    type: z.literal("call.incoming"),
    data: z.object({
      conversationId: z.string().uuid(),
      roomName: z.string().min(1),
      caller: callerSummary,
    }),
  }),
  signalEnvelope.extend({
    type: z.literal("call.cancelled"),
    data: z.object({ conversationId: z.string().uuid() }),
  }),
  signalEnvelope.extend({
    type: z.literal("call.declined"),
    data: z.object({ conversationId: z.string().uuid() }),
  }),
  signalEnvelope.extend({
    type: z.literal("call.accepted"),
    data: z.object({ conversationId: z.string().uuid() }),
  }),
]);

export type SignalEvent = z.infer<typeof SignalEventSchema>;
export type SignalEventType = SignalEvent["type"];

export function parseSignalEvent(raw: unknown): SignalEvent | null {
  const result = SignalEventSchema.safeParse(raw);
  return result.success ? result.data : null;
}
