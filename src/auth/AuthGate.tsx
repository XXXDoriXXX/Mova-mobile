import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

import { useOnboardingStore } from "@/onboarding/store";
import { decideAuthRedirect } from "@/features/auth";

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
    if (__DEV__) {
      console.log(
        "[mova/gate] status=",
        status,
        " onboarding=",
        onboardingStatus,
        " segment=",
        segments[0],
      );
    }
    const target = decideAuthRedirect({
      status,
      onboarding: onboardingStatus,
      segment: segments[0],
      subSegment: (segments as string[])[1],
    });
    if (target) {
      if (__DEV__) console.log("[mova/gate] →", target);
      router.replace(target);
    }
  }, [status, segments, router, onboardingStatus]);

  return <>{children}</>;
}
