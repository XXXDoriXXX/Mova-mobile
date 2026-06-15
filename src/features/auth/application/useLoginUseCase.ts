import { useState } from "react";

import { login as loginRequest } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { extractErrorPayload, extractErrorStatus } from "@/api/client";
import { triggerHaptic } from "@/utils/haptics";

import { useAuthErrorMapper, type AuthErrorMapping } from "../useAuthErrorMessage";
import type { LoginValues } from "../schemas";

export type LoginResult =
  | { ok: true }
  // The account exists but its email is not confirmed — route to the verify
  // gate (with a resend), don't show a generic "blocked" banner.
  | { ok: false; needsVerification: true; email: string }
  | { ok: false; error: AuthErrorMapping };

function isEmailNotVerified(err: unknown): boolean {
  return (
    extractErrorStatus(err) === 403 &&
    extractErrorPayload(err)?.code === "EMAIL_NOT_VERIFIED"
  );
}

export function useLoginUseCase() {
  const setSession = useAuthStore((s) => s.setSession);
  const mapError = useAuthErrorMapper();
  const [submitting, setSubmitting] = useState(false);

  async function execute(values: LoginValues): Promise<LoginResult> {
    setSubmitting(true);
    try {
      const resp = await loginRequest(values);
      await setSession({ user: resp.user, tokens: resp.tokens });
      triggerHaptic("success");
      return { ok: true };
    } catch (err) {
      triggerHaptic("error");
      if (isEmailNotVerified(err)) {
        return { ok: false, needsVerification: true, email: values.email };
      }
      return { ok: false, error: mapError(err) };
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, execute };
}
