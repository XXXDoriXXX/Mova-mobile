import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

import { useAuthStore } from "./store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === "unknown") return;
    const inAuthGroup = segments[0] === "(auth)";

    if (status === "authed" && inAuthGroup) {
      router.replace("/home");
    } else if (status === "guest" && !inAuthGroup) {
      router.replace("/welcome");
    }
  }, [status, segments, router]);

  return <>{children}</>;
}
