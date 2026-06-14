import {
  googleClientIds,
  isGoogleSignInConfigured,
} from "@/features/auth/application/googleAuthConfig";

describe("googleAuthConfig", () => {
  it("reports NOT configured when the platform client id is missing", () => {
    expect(googleClientIds.web).toBeUndefined();
    expect(googleClientIds.android).toBeUndefined();
    expect(googleClientIds.ios).toBeUndefined();
    expect(isGoogleSignInConfigured()).toBe(false);
  });
});
