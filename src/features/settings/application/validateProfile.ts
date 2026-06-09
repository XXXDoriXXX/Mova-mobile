import { isE164 } from "@/utils/phone";

export type ProfileValidation =
  | { ok: true; name: string; phone: string | undefined }
  | { ok: false; reason: "nameRequired" | "badPhone" };

export function validateProfile(rawName: string, rawPhone: string): ProfileValidation {
  const name = rawName.trim();
  if (!name) return { ok: false, reason: "nameRequired" };
  const phone = rawPhone.trim();
  if (phone && !isE164(phone)) return { ok: false, reason: "badPhone" };
  return { ok: true, name, phone: phone || undefined };
}
