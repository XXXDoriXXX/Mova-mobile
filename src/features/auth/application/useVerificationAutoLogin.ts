import { useCallback, useEffect, useState } from "react";

import { login } from "@/api/auth";
import { extractErrorPayload, extractErrorStatus } from "@/api/client";
import { useAuthStore } from "@/auth/store";
import { usePendingVerificationStore } from "@/auth/pendingVerificationStore";
import { triggerHaptic } from "@/utils/haptics";

function isEmailNotVerified(err: unknown): boolean {
  return (
    extractErrorStatus(err) === 403 &&
    extractErrorPayload(err)?.code === "EMAIL_NOT_VERIFIED"
  );
}

const POLL_MS = 4000;

// While the verify-email gate is shown, quietly retry the stored login every
// few seconds. The moment the user confirms their email (in the browser), the
// login succeeds, a session is created (clearing the pending record), and the
// auth gate moves them into the app — no manual re-login.
export function useVerificationAutoLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const pending = usePendingVerificationStore((s) => s.pending);
  const [checking, setChecking] = useState(false);
  const [stillUnverified, setStillUnverified] = useState(false);

  const attempt = useCallback(
    async (manual = false): Promise<boolean> => {
      if (!pending) return false;
      setChecking(true);
      try {
        const resp = await login({
          email: pending.email,
          password: pending.password,
        });
        // setSession clears the pending record + stored password.
        await setSession({ user: resp.user, tokens: resp.tokens });
        triggerHaptic("success");
        return true;
      } catch (err) {
        if (isEmailNotVerified(err)) {
          setStillUnverified(true);
          if (manual) triggerHaptic("warning");
        }
        // Any other error (network, etc.) is ignored for the silent poll; the
        // user can keep trying.
        return false;
      } finally {
        setChecking(false);
      }
    },
    [pending, setSession],
  );

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => {
      void attempt();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [pending, attempt]);

  return {
    checking,
    stillUnverified,
    // Force an immediate check (e.g. the "I've confirmed" button).
    checkNow: () => attempt(true),
  };
}
