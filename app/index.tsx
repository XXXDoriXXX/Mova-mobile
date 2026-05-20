import { useEffect } from "react";
import { useRouter } from "expo-router";

import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";
import { useAuthStore } from "@/auth/store";

export default function BootScreen() {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") router.replace("/home");
    else if (status === "guest") router.replace("/welcome");
  }, [status, router]);

  return (
    <Screen>
      <Spinner />
    </Screen>
  );
}
