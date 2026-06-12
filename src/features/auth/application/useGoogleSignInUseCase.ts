import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { signInWithGoogle } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { triggerHaptic } from "@/utils/haptics";

import { googleClientIds } from "./googleAuthConfig";

WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInState = {
  ready: boolean;
  busy: boolean;
  error: string | null;
};

export function useGoogleSignInUseCase() {
  const setSession = useAuthStore((s) => s.setSession);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientIds.web,
    androidClientId: googleClientIds.android,
    iosClientId: googleClientIds.ios,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type !== "success") {
      if (response.type === "error") {
        setError(response.error?.message ?? "Google sign-in failed");
      }
      setBusy(false);
      return;
    }
    const idToken = response.params.id_token;
    if (!idToken) {
      setError("Google response missing id_token");
      setBusy(false);
      return;
    }
    void (async () => {
      try {
        const resp = await signInWithGoogle(idToken);
        await setSession({ user: resp.user, tokens: resp.tokens });
        triggerHaptic("success");
      } catch (err) {
        triggerHaptic("error");
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    })();
  }, [response, setSession]);

  async function start() {
    if (!request) return;
    setError(null);
    setBusy(true);
    try {
      await promptAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return { ready: request != null, busy, error, start };
}
