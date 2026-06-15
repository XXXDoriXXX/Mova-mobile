import { useState } from "react";
import auth, {
  type FirebaseAuthTypes,
} from "@react-native-firebase/auth";

import { confirmPhone, getMe } from "@/api/auth";
import { useAuthStore } from "@/auth/store";
import { callWarn } from "@/observability/callLog";

import { mapPhoneVerifyError } from "./phoneVerifyErrors";

export type PhoneVerifyStep = "phone" | "code" | "done";

export interface PhoneVerification {
  step: PhoneVerifyStep;
  busy: boolean;
  error: string | null;
  phoneNumber: string | null;
  sendCode: (phoneE164: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  reset: () => void;
}

// Firebase Phone Auth is only a means to PROVE the number — the app keeps its
// own JWT session. We sign in to Firebase, confirm the SMS code, hand the
// resulting ID token to our backend (/auth/phone/confirm), then sign back out.
export function usePhoneVerification(): PhoneVerification {
  const [step, setStep] = useState<PhoneVerifyStep>("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [confirmation, setConfirmation] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  async function sendCode(phoneE164: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const result = await auth().signInWithPhoneNumber(phoneE164);
      setConfirmation(result);
      setStep("code");
    } catch (err) {
      setError(mapPhoneVerifyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(code: string): Promise<void> {
    if (!confirmation) return;
    setBusy(true);
    setError(null);
    try {
      await confirmation.confirm(code);
      const idToken = await auth().currentUser?.getIdToken(true);
      if (!idToken) throw new Error("missing firebase id token");
      const { phoneNumber: confirmed } = await confirmPhone(idToken);
      setPhoneNumber(confirmed);
      // Refresh our own profile so the verified number shows immediately.
      try {
        const me = await getMe();
        setUser(me);
      } catch (err) {
        callWarn("verifyPhone.refreshFailed", {
          message: err instanceof Error ? err.message : String(err),
        });
      }
      setStep("done");
    } catch (err) {
      setError(mapPhoneVerifyError(err));
    } finally {
      // Firebase only proved the number — drop its session; our JWT stands.
      await auth()
        .signOut()
        .catch(() => undefined);
      setBusy(false);
    }
  }

  function reset(): void {
    setStep("phone");
    setError(null);
    setConfirmation(null);
    setPhoneNumber(null);
  }

  return { step, busy, error, phoneNumber, sendCode, verifyCode, reset };
}
