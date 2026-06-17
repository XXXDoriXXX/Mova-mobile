import { decideAuthRedirect } from "@/features/auth/application/decideAuthRedirect";

describe("decideAuthRedirect", () => {
  describe("hydration still pending", () => {
    it("returns null while auth status is unknown", () => {
      expect(
        decideAuthRedirect({
          status: "unknown",
          onboarding: "done",
          verification: "none",
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
          verification: "none",
          segment: "(app)",
          subSegment: undefined,
        }),
      ).toBeNull();
    });

    it("returns null while verification status is unknown", () => {
      expect(
        decideAuthRedirect({
          status: "guest",
          onboarding: "done",
          verification: "unknown",
          segment: undefined,
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
          verification: "none",
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
          verification: "none",
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
          verification: "none",
          segment: "(auth)",
          subSegment: "login",
        }),
      ).toBeNull();
    });
  });

  describe("pending email verification (guest)", () => {
    it("parks the user on /verify-email from anywhere", () => {
      expect(
        decideAuthRedirect({
          status: "guest",
          onboarding: "needed",
          verification: "pending",
          segment: undefined,
          subSegment: undefined,
        }),
      ).toBe("/verify-email");
    });

    it("redirects even from the welcome screen", () => {
      expect(
        decideAuthRedirect({
          status: "guest",
          onboarding: "needed",
          verification: "pending",
          segment: "(auth)",
          subSegment: "welcome",
        }),
      ).toBe("/verify-email");
    });

    it("stays put once on the verify-email screen — no loop", () => {
      expect(
        decideAuthRedirect({
          status: "guest",
          onboarding: "needed",
          verification: "pending",
          segment: "(auth)",
          subSegment: "verify-email",
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
          verification: "none",
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
          verification: "none",
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
          verification: "none",
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
          verification: "none",
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
          verification: "none",
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
          verification: "none",
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
          verification: "none",
          segment: "(app)",
          subSegment: "onboarding",
        }),
      ).toBeNull();
    });
  });
});
