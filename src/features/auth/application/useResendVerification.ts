import { useState } from "react";

import { resendVerification } from "@/api/auth";
import { triggerHaptic } from "@/utils/haptics";

export type ResendState = "idle" | "sending" | "sent" | "error";

// Re-send the email verification link from the post-register / blocked-login
// gate. The server always answers 202 (it never reveals whether the address
// exists), so a network failure is the only error we surface.
export function useResendVerification(email: string) {
  const [state, setState] = useState<ResendState>("idle");

  async function resend(): Promise<void> {
    setState("sending");
    try {
      await resendVerification(email);
      triggerHaptic("success");
      setState("sent");
    } catch {
      triggerHaptic("error");
      setState("error");
    }
  }

  return { state, resend };
}
