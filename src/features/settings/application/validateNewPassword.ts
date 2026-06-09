export type NewPasswordValidation =
  | { ok: true }
  | { ok: false; reason: "tooShort" | "mismatch" };

export function validateNewPassword(
  next: string,
  confirm: string,
): NewPasswordValidation {
  if (next.length < 8) return { ok: false, reason: "tooShort" };
  if (next !== confirm) return { ok: false, reason: "mismatch" };
  return { ok: true };
}
