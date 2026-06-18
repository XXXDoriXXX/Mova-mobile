import {
  ServerEventSchema,
  parseServerEvent,
  ClientCommandSchema,
  parseClientCommand,
} from "@/realtime/protocol";

const FIXTURES = [
  "call.connected",
  "transcript.partial",
  "transcript.final",
  "transcript.turn_end",
  "ai.thinking",
  "ai.text.partial",
  "ai.text.final",
  "ai.tts.start",
  "ai.tts.end",
  "suggestions.new",
  "usage.tick",
  "usage.tick.paid",
  "call.config.changed",
  "call.error.recoverable",
  "call.error.fatal",
  "call.ended",
  "pong",
] as const;

describe("ServerEventSchema", () => {
  it.each(FIXTURES)("accepts %s fixture", (name) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const payload = require(`../fixtures/ws/${name}.json`) as unknown;
    const result = ServerEventSchema.safeParse(payload);
    if (!result.success) {
      throw new Error(`${name} failed: ${JSON.stringify(result.error.issues)}`);
    }
    expect(result.success).toBe(true);
  });

  it("rejects events with unknown discriminant", () => {
    expect(
      ServerEventSchema.safeParse({
        type: "totally.fake",
        id: "11111111-1111-1111-1111-111111111111",
        timestamp: "2026-05-20T12:00:00.000Z",
        data: {},
      }).success,
    ).toBe(false);
  });

  it("rejects events missing required envelope fields", () => {
    expect(
      ServerEventSchema.safeParse({
        type: "call.connected",
        data: { conversationId: "22222222-2222-2222-2222-222222222222" },
      }).success,
    ).toBe(false);
  });

  it("rejects transcript.final without messageId", () => {
    expect(
      ServerEventSchema.safeParse({
        type: "transcript.final",
        id: "11111111-1111-1111-1111-111111111113",
        timestamp: "2026-05-20T12:00:02.000Z",
        data: { text: "hello" },
      }).success,
    ).toBe(false);
  });

  it("parseServerEvent returns null on invalid payload, not throws", () => {
    expect(parseServerEvent({ bogus: true })).toBeNull();
    expect(parseServerEvent(null)).toBeNull();
    expect(parseServerEvent("not even an object")).toBeNull();
  });
});

describe("ClientCommandSchema", () => {
  it("accepts user.speak", () => {
    expect(
      ClientCommandSchema.safeParse({
        type: "user.speak",
        data: { text: "Hello" },
      }).success,
    ).toBe(true);
  });

  it("accepts ping with no data", () => {
    expect(ClientCommandSchema.safeParse({ type: "ping" }).success).toBe(true);
  });

  it("rejects user.speak with empty text", () => {
    expect(
      ClientCommandSchema.safeParse({
        type: "user.speak",
        data: { text: "" },
      }).success,
    ).toBe(false);
  });

  it("rejects user.speak with text > 2000 chars", () => {
    expect(
      ClientCommandSchema.safeParse({
        type: "user.speak",
        data: { text: "x".repeat(2001) },
      }).success,
    ).toBe(false);
  });

  it("parseClientCommand returns null on invalid", () => {
    expect(parseClientCommand({ type: "fake" })).toBeNull();
  });
});
