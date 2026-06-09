import { extractErrorPayload } from "@/api/client";

export type ChangePasswordErrorKind = "wrongCurrent" | "weakNew" | "generic";

export function mapChangePasswordError(err: unknown): ChangePasswordErrorKind {
  const payload = extractErrorPayload(err);
  if (payload?.statusCode === 401) return "wrongCurrent";
  if (payload?.error === "WEAK_PASSWORD") return "weakNew";
  return "generic";
}
