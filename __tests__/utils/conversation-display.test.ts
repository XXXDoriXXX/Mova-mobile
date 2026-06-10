import {
  conversationTitle,
  isPeerCall,
} from "@/utils/conversation-display";

describe("conversation-display", () => {
  it("titles a SIP call with its formatted phone", () => {
    expect(
      conversationTitle({
        callType: "sip_outbound",
        caller: null,
        targetPhone: "+380501234567",
      }),
    ).toBe("+380 50 123 45 67");
  });

  it("titles a peer call with the caller name", () => {
    expect(
      conversationTitle({
        callType: "peer_inbound",
        caller: { id: "u1", name: "Олег" },
        targetPhone: null,
      }),
    ).toBe("Олег");
  });

  it("falls back to a generic label for a peer call without a caller", () => {
    expect(
      conversationTitle({
        callType: "peer_inbound",
        caller: null,
        targetPhone: null,
      }),
    ).toBe("Онлайн-дзвінок");
  });

  it("detects peer calls", () => {
    expect(isPeerCall({ callType: "peer_inbound" })).toBe(true);
    expect(isPeerCall({ callType: "sip_outbound" })).toBe(false);
  });
});
