import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

import { useOnboardingStore } from "@/onboarding/store";
import { useLanguageStore } from "@/i18n/languageStore";
import { decideAuthRedirect } from "@/features/auth";

import { useAuthStore } from "./store";
import { usePendingVerificationStore } from "./pendingVerificationStore";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const onboardingStatus = useOnboardingStore((s) => s.status);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);
  const pendingStatus = usePendingVerificationStore((s) => s.status);
  const pending = usePendingVerificationStore((s) => s.pending);
  const hydratePending = usePendingVerificationStore((s) => s.hydrate);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
    void hydrateOnboarding();
    void hydratePending();
    void hydrateLanguage();
  }, [hydrate, hydrateOnboarding, hydratePending, hydrateLanguage]);

  const verification =
    pendingStatus === "unknown" ? "unknown" : pending ? "pending" : "none";

  useEffect(() => {
    const target = decideAuthRedirect({
      status,
      onboarding: onboardingStatus,
      verification,
      segment: segments[0],
      subSegment: (segments as string[])[1],
    });
    if (target) {
      if (__DEV__) console.log("[mova/gate] →", target);
      router.replace(target);
    }
  }, [status, segments, router, onboardingStatus, verification]);

  return <>{children}</>;
}
