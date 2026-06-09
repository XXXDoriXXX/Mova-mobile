import { useState } from "react";

import { persistLanguage, register as registerRequest } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { triggerHaptic } from "@/utils/haptics";

import { useAuthErrorMapper, type AuthErrorMapping } from "../useAuthErrorMessage";
import type { RegisterValues } from "../schemas";

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: AuthErrorMapping };

export function useRegisterUseCase() {
  const setSession = useAuthStore((s) => s.setSession);
  const mapError = useAuthErrorMapper();
  const [submitting, setSubmitting] = useState(false);

  async function execute(values: RegisterValues): Promise<RegisterResult> {
    setSubmitting(true);
    try {
      const resp = await registerRequest({
        email: values.email,
        password: values.password,
        name: values.name,
      });
      await setSession({ user: resp.user, tokens: resp.tokens });
      triggerHaptic("success");
      if (values.language && values.language !== resp.user.language) {
        void persistLanguage(values.language);
      }
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
