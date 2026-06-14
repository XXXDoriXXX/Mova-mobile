const E164 = /^\+[1-9]\d{6,14}$/;
const SHORT_CODE = /^[*#]?\d{2,6}$/;

export function isE164(value: string): boolean {
  return E164.test(value.trim());
}

export function isShortCode(value: string): boolean {
  return SHORT_CODE.test(value.trim());
}

export function isDialable(value: string): boolean {
  const trimmed = value.trim();
  return isE164(trimmed) || isShortCode(trimmed);
}

export function formatPhoneForDisplay(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!isE164(trimmed)) return trimmed;
  if (trimmed.startsWith("+380") && trimmed.length === 13) {
    return `+380 ${trimmed.slice(4, 6)} ${trimmed.slice(6, 9)} ${trimmed.slice(9, 11)} ${trimmed.slice(11)}`;
  }
  return trimmed;
}
