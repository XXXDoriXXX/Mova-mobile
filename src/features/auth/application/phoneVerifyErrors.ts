import { extractErrorPayload } from "@/api/client";

// Map a Firebase Auth error code or a backend error payload to a stable UI key.
// Pure + unit-tested — the hook only wires it to native calls.
export function mapPhoneVerifyError(err: unknown): string {
  const code = (err as { code?: string } | undefined)?.code;
  switch (code) {
    case "auth/invalid-phone-number":
      return "verifyPhone.errInvalidNumber";
    case "auth/invalid-verification-code":
      return "verifyPhone.errInvalidCode";
    case "auth/code-expired":
      return "verifyPhone.errCodeExpired";
    case "auth/too-many-requests":
      return "verifyPhone.errTooMany";
    case "auth/missing-client-identifier":
    case "auth/app-not-authorized":
      return "verifyPhone.errAppConfig";
  }
  const status = extractErrorPayload(err)?.statusCode;
  if (status === 409) return "verifyPhone.errAlreadyTaken";
  if (status === 401) return "verifyPhone.errTokenRejected";
  return "verifyPhone.errGeneric";
}
