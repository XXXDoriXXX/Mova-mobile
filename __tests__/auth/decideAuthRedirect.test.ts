import { decideAuthRedirect } from "@/features/auth/application/decideAuthRedirect";

describe("decideAuthRedirect", () => {
  describe("hydration still pending", () => {
    it("returns null while auth status is unknown", () => {
      expect(
        decideAuthRedirect({
          status: "unknown",
          onboarding: "done",
          segment: undefined,
          subSegment: undefined,
        }),
      ).toBeNull();
    });

    it("returns null while onboarding status is unknown", () => {
      expect(
        decideAuthRedirect({
          status: "authed",
          onboarding: "unknown",
          segment: "(app)",
          subSegment: undefined,
        }),
      ).toBeNull();
    });
  });

  describe("guest", () => {
    it("redirects from root to /welcome", () => {
      expect(
        decideAuthRedirect({
          status: "guest",
          onboarding: "needed",
          segment: undefined,
          subSegment: undefined,
        }),
      ).toBe("/welcome");
    });

    it("redirects from (app) to /welcome", () => {
      expect(
        decideAuthRedirect({
          status: "guest",
          onboarding: "done",
          segment: "(app)",
          subSegment: "home",
        }),
      ).toBe("/welcome");
    });

    it("stays inside (auth) — no loop", () => {
      expect(
        decideAuthRedirect({
          status: "guest",
          onboarding: "needed",
          segment: "(auth)",
          subSegment: "login",
        }),
      ).toBeNull();
    });
  });

  describe("authed", () => {
    it("from root with onboarding done → /home", () => {
      expect(
        decideAuthRedirect({
          status: "authed",
          onboarding: "done",
          segment: undefined,
          subSegment: undefined,
        }),
      ).toBe("/home");
    });

    it("from root with onboarding needed → /onboarding", () => {
      expect(
        decideAuthRedirect({
          status: "authed",
          onboarding: "needed",
          segment: undefined,
          subSegment: undefined,
        }),
      ).toBe("/onboarding");
    });

    it("from (auth) group → /home", () => {
      expect(
        decideAuthRedirect({
          status: "authed",
          onboarding: "done",
          segment: "(auth)",
          subSegment: "login",
        }),
      ).toBe("/home");
    });

    it("from (auth) group + needs onboarding → /onboarding", () => {
      expect(
        decideAuthRedirect({
          status: "authed",
          onboarding: "needed",
          segment: "(auth)",
          subSegment: "welcome",
        }),
      ).toBe("/onboarding");
    });

    it("inside (app) and onboarded → stays put", () => {
      expect(
        decideAuthRedirect({
          status: "authed",
          onboarding: "done",
          segment: "(app)",
          subSegment: "home",
        }),
      ).toBeNull();
    });

    it("inside (app) but needs onboarding and not on the onboarding screen → /onboarding", () => {
      expect(
        decideAuthRedirect({
          status: "authed",
          onboarding: "needed",
          segment: "(app)",
          subSegment: "home",
        }),
      ).toBe("/onboarding");
    });

    it("on the onboarding screen — stays put", () => {
      expect(
        decideAuthRedirect({
          status: "authed",
          onboarding: "needed",
          segment: "(app)",
          subSegment: "onboarding",
        }),
      ).toBeNull();
    });
  });
});
