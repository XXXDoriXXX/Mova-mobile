export type AuthHydrationStatus = "unknown" | "authed" | "guest";
export type OnboardingHydrationStatus = "unknown" | "needed" | "done";
export type VerificationHydrationStatus = "unknown" | "pending" | "none";

export type AuthRedirectInput = {
  status: AuthHydrationStatus;
  onboarding: OnboardingHydrationStatus;
  // Whether an unconfirmed registration/login is waiting on email verification.
  verification: VerificationHydrationStatus;
  segment: string | undefined;
  subSegment: string | undefined;
};

export type AuthRedirectTarget =
  | "/welcome"
  | "/home"
  | "/onboarding"
  | "/verify-email";

export function decideAuthRedirect(
  input: AuthRedirectInput,
): AuthRedirectTarget | null {
  const { status, onboarding, verification, segment, subSegment } = input;

  // Wait until every persisted flag has hydrated to avoid redirect flicker.
  if (
    status === "unknown" ||
    onboarding === "unknown" ||
    verification === "unknown"
  )
    return null;

  const inAuthGroup = segment === "(auth)";
  const inAppGroup = segment === "(app)";
  const inOnboarding = subSegment === "onboarding";
  const onVerifyEmail = subSegment === "verify-email";
  const needsOnboarding = onboarding === "needed";

  if (status === "guest") {
    // A pending email verification takes precedence: park the user on the
    // verify gate (which remembers across restarts) until they confirm. The
    // "change email" action clears `pending`, so it won't trap them there.
    if (verification === "pending") {
      return onVerifyEmail ? null : "/verify-email";
    }
    return inAuthGroup ? null : "/welcome";
  }

  if (!inAppGroup) {
    return needsOnboarding ? "/onboarding" : "/home";
  }

  if (needsOnboarding && !inOnboarding) {
    return "/onboarding";
  }

  return null;
}
