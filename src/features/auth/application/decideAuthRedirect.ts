export type AuthHydrationStatus = "unknown" | "authed" | "guest";
export type OnboardingHydrationStatus = "unknown" | "needed" | "done";

export type AuthRedirectInput = {
  status: AuthHydrationStatus;
  onboarding: OnboardingHydrationStatus;
  segment: string | undefined;
  subSegment: string | undefined;
};

export type AuthRedirectTarget = "/welcome" | "/home" | "/onboarding";

export function decideAuthRedirect(input: AuthRedirectInput): AuthRedirectTarget | null {
  const { status, onboarding, segment, subSegment } = input;

  if (status === "unknown" || onboarding === "unknown") return null;

  const inAuthGroup = segment === "(auth)";
  const inAppGroup = segment === "(app)";
  const inOnboarding = subSegment === "onboarding";
  const needsOnboarding = onboarding === "needed";

  if (status === "guest") {
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
