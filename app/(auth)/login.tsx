import { useEffect } from "react";
import { useRouter } from "expo-router";

import { Screen } from "@/components/Screen";
import { Spinner } from "@/components/Spinner";

export default function LoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/welcome");
  }, [router]);
  return (
    <Screen>
      <Spinner />
    </Screen>
  );
}
