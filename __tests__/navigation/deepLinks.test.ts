import { DeepLinks } from "@/navigation/deepLinks";

describe("DeepLinks builders", () => {
  it("welcome / home / history / settings / billing / templates / styles", () => {
    expect(DeepLinks.welcome()).toBe("mova://welcome");
    expect(DeepLinks.home()).toBe("mova://home");
    expect(DeepLinks.history()).toBe("mova://history");
    expect(DeepLinks.settings()).toBe("mova://settings");
    expect(DeepLinks.billing()).toBe("mova://billing");
    expect(DeepLinks.templates()).toBe("mova://templates");
    expect(DeepLinks.styles()).toBe("mova://styles");
    expect(DeepLinks.styleProfile()).toBe("mova://settings/style-profile");
  });

  it("conversation encodes the id", () => {
    expect(DeepLinks.conversation("abc/def")).toBe(
      "mova://conversation/abc%2Fdef",
    );
  });

  it("callPre", () => {
    expect(DeepLinks.callPre()).toBe("mova://call/pre");
  });

  it("callLive: only conversationId", () => {
    expect(DeepLinks.callLive({ conversationId: "uuid-1" })).toBe(
      "mova://call/live?conversationId=uuid-1",
    );
  });

  it("callLive: with initialStyleId", () => {
    expect(
      DeepLinks.callLive({
        conversationId: "uuid-1",
        initialStyleId: "builtin:friendly",
      }),
    ).toBe(
      "mova://call/live?conversationId=uuid-1&initialStyleId=builtin%3Afriendly",
    );
  });
});
