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
    if (status === "unknown" || onboardingStatus === "unknown") return;
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = (segments as string[])[1] === "onboarding";
    const needsOnboarding = onboardingStatus === "needed";

    if (status === "guest" && !inAuthGroup) {
      router.replace("/welcome");
      return;
    }
    if (status === "authed") {
      if (inAuthGroup) {
        router.replace(needsOnboarding ? "/onboarding" : "/home");
        return;
      }
      if (needsOnboarding && !inOnboarding) {
        router.replace("/onboarding");
      }
    }
  }, [status, segments, router, onboardingStatus]);

  return <>{children}</>;
}
