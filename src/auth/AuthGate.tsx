import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

import { useOnboardingStore } from "@/onboarding/store";

import { useAuthStore } from "./store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const onboardingStatus = useOnboardingStore((s) => s.status);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
    void hydrateOnboarding();
  }, [hydrate, hydrateOnboarding]);

  useEffect(() => {
    if (__DEV__) console.log("[mova/gate] status=", status, " onboarding=", onboardingStatus, " segment=", segments[0]);
    if (status === "unknown" || onboardingStatus === "unknown") return;
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = (segments as string[])[1] === "onboarding";
    const needsOnboarding = onboardingStatus === "needed";

    const inAppGroup = segments[0] === "(app)";

    if (status === "guest" && !inAuthGroup) {
      if (__DEV__) console.log("[mova/gate] guest → /welcome");
      router.replace("/welcome");
      return;
    }
    if (status === "authed" && !inAppGroup) {
      const target = needsOnboarding ? "/onboarding" : "/home";
      if (__DEV__) console.log("[mova/gate] authed outside (app) →", target);
      router.replace(target);
      return;
    }
    if (status === "authed" && needsOnboarding && !inOnboarding) {
      if (__DEV__) console.log("[mova/gate] authed in (app) but needs onboarding → /onboarding");
      router.replace("/onboarding");
    }
  }, [status, segments, router, onboardingStatus]);

  return <>{children}</>;
}
