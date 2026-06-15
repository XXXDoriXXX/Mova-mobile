import {
  extractTaskCallData,
  toIncomingCall,
} from "@/notifications/incomingCallPayload";

const valid = {
  type: "incoming_call",
  conversationId: "c1",
  roomName: "r1",
  callerId: "u1",
  callerName: "Ada",
};

describe("toIncomingCall", () => {
  it("maps a complete payload", () => {
    expect(toIncomingCall(valid)).toEqual({
      conversationId: "c1",
      roomName: "r1",
      caller: { id: "u1", name: "Ada" },
    });
  });

  it("defaults a missing caller name", () => {
    expect(toIncomingCall({ ...valid, callerName: undefined })?.caller.name).toBe(
      "Невідомий",
    );
  });

  it("rejects a non-call or incomplete payload", () => {
    expect(toIncomingCall({ type: "marketing" })).toBeNull();
    expect(toIncomingCall({ ...valid, conversationId: undefined })).toBeNull();
    expect(toIncomingCall({ ...valid, roomName: undefined })).toBeNull();
  });
});

describe("extractTaskCallData", () => {
  it("parses a headless dataString payload (killed app)", () => {
    expect(
      extractTaskCallData({ data: { dataString: JSON.stringify(valid) } }),
    ).toEqual(valid);
  });

  it("reads a tapped NotificationResponse shape", () => {
    expect(
      extractTaskCallData({
        notification: { request: { content: { data: valid } } },
      }),
    ).toEqual(valid);
  });

  it("reads an already-parsed data object", () => {
    expect(extractTaskCallData({ data: valid })).toEqual(valid);
  });

  it("returns null for malformed dataString and unknown shapes", () => {
    expect(extractTaskCallData({ data: { dataString: "{not json" } })).toBeNull();
    expect(extractTaskCallData(null)).toBeNull();
    expect(extractTaskCallData({})).toBeNull();
  });
});
