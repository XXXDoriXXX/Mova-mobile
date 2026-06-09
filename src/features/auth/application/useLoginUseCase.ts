import { useState } from "react";

import { login as loginRequest } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { triggerHaptic } from "@/utils/haptics";

import { useAuthErrorMapper, type AuthErrorMapping } from "../useAuthErrorMessage";
import type { LoginValues } from "../schemas";

export type LoginResult =
  | { ok: true }
  | { ok: false; error: AuthErrorMapping };

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
      return { ok: false, error: mapError(err) };
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, execute };
}
