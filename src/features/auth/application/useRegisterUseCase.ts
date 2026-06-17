import { useState } from "react";

import { register as registerRequest } from "@/api/auth";
import { usePendingVerificationStore } from "@/auth/pendingVerificationStore";
import { triggerHaptic } from "@/utils/haptics";

import { useAuthErrorMapper, type AuthErrorMapping } from "../useAuthErrorMessage";
import type { RegisterValues } from "../schemas";

// Registration no longer issues a session — it mails a verification link and
// the user must confirm before logging in. Success carries the email so the
// gate screen can show "we sent a link to <email>" and offer a resend.
export type RegisterResult =
  | { ok: true; email: string }
  | { ok: false; error: AuthErrorMapping };

export function useRegisterUseCase() {
  const mapError = useAuthErrorMapper();
  const [submitting, setSubmitting] = useState(false);

  async function execute(values: RegisterValues): Promise<RegisterResult> {
    setSubmitting(true);
    try {
      const resp = await registerRequest({
        email: values.email,
        password: values.password,
        name: values.name,
        username: values.username,
      });
      // Remember the pending verification (incl. password) so the gate can
      // auto-log-in once confirmed, and survive an app restart.
      await usePendingVerificationStore.getState().set({
        email: values.email,
        password: values.password,
      });
      triggerHaptic("success");
      return { ok: true, email: resp.email };
    } catch (err) {
      triggerHaptic("error");
      return { ok: false, error: mapError(err) };
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, execute };
}
