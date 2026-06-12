import {
  googleClientIds,
  isGoogleSignInConfigured,
} from "@/features/auth/application/googleAuthConfig";

describe("googleAuthConfig", () => {
  it("reports NOT configured when the platform client id is missing", () => {
    // jest.setup mocks expo-constants extra with only apiUrl/wsUrl — i.e. the
    // exact scenario that used to make expo-auth-session throw on render.
    expect(googleClientIds.web).toBeUndefined();
    expect(googleClientIds.android).toBeUndefined();
    expect(googleClientIds.ios).toBeUndefined();
    expect(isGoogleSignInConfigured()).toBe(false);
  });
});
